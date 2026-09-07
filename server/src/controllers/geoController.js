const {
  Booking,
  User,
  WorkerProfile,
  WorkerLocation,
  CustomerProfile,
} = require('../models');

const {
  geocodeAddress,
  reverseGeocode,
  getDistanceAndDuration,
  generateRouteWaypoints,
  sanitizeLocationForCustomer,
  NCR_LOCAL_CATALOGUE,
} = require('../services/geoService');

const { BOOKING_STATES, verifyBookingAccess } = require('../services/bookingStateMachine');
const { getIO } = require('../socket');

/**
 * POST /api/geo/geocode
 * Search address or get coordinates
 */
const handleGeocode = async (req, res, next) => {
  try {
    const { address, query } = req.body;
    const searchQuery = address || query || '';
    const result = await geocodeAddress(searchQuery);

    res.status(200).json({
      success: true,
      ...result,
      suggestions: NCR_LOCAL_CATALOGUE.map((item) => ({
        name: item.name,
        formattedAddress: item.formattedAddress,
        coordinates: item.coordinates,
        city: item.city,
        pincode: item.pincode,
      })),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/geo/reverse-geocode
 * Convert [lng, lat] coordinates to address
 */
const handleReverseGeocode = async (req, res, next) => {
  try {
    const { coordinates, lat, lng } = req.body;
    let targetLng = lng;
    let targetLat = lat;

    if (Array.isArray(coordinates) && coordinates.length >= 2) {
      targetLng = coordinates[0];
      targetLat = coordinates[1];
    }

    if (targetLng === undefined || targetLat === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Coordinates [lng, lat] are required for reverse geocoding.',
      });
    }

    const result = await reverseGeocode(Number(targetLng), Number(targetLat));
    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/geo/worker-service-area
 * Worker checks configured service radius & current availability location
 */
const getWorkerServiceArea = async (req, res, next) => {
  try {
    const workerId = req.user._id;

    const [profile, liveLoc] = await Promise.all([
      WorkerProfile.findOne({ user: workerId }),
      WorkerLocation.findOne({ worker: workerId }),
    ]);

    const serviceRadiusKm = liveLoc?.serviceRadiusKm || profile?.maxServiceRadiusKm || 12;
    const currentLocation = liveLoc?.location?.coordinates || profile?.homeBaseLocation?.coordinates || [77.2090, 28.6139];
    const isTrackingActive = liveLoc?.isTrackingActive !== false;

    res.status(200).json({
      success: true,
      serviceArea: {
        workerId,
        serviceRadiusKm,
        coordinates: currentLocation,
        isTrackingActive,
        areaDescription: profile?.serviceAreaDescription || 'South Delhi & Central NCR',
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/geo/worker-service-area
 * Worker updates operational service radius (e.g. 5km - 30km) and homebase location
 */
const updateWorkerServiceArea = async (req, res, next) => {
  try {
    const workerId = req.user._id;
    const { serviceRadiusKm, coordinates, areaDescription } = req.body;

    const updates = {};
    if (serviceRadiusKm !== undefined) {
      const rad = Math.max(2, Math.min(50, Number(serviceRadiusKm)));
      updates.serviceRadiusKm = rad;
      await WorkerProfile.findOneAndUpdate(
        { user: workerId },
        { maxServiceRadiusKm: rad, ...(areaDescription ? { serviceAreaDescription: areaDescription } : {}) }
      );
    }

    if (Array.isArray(coordinates) && coordinates.length >= 2) {
      updates.location = {
        type: 'Point',
        coordinates: [Number(coordinates[0]), Number(coordinates[1])],
      };
      await WorkerProfile.findOneAndUpdate(
        { user: workerId },
        { 'homeBaseLocation.coordinates': [Number(coordinates[0]), Number(coordinates[1])] }
      );
    }

    const liveLoc = await WorkerLocation.findOneAndUpdate(
      { worker: workerId },
      {
        $set: {
          ...updates,
          updatedAt: new Date(),
        },
      },
      { new: true, upsert: true }
    );

    res.status(200).json({
      success: true,
      message: 'Worker service area and operational radius successfully updated.',
      serviceArea: {
        workerId,
        serviceRadiusKm: liveLoc.serviceRadiusKm,
        coordinates: liveLoc.location.coordinates,
        isTrackingActive: liveLoc.isTrackingActive,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/geo/worker-location
 * Worker sends real-time GPS telemetry from mobile app
 */
const reportWorkerLocation = async (req, res, next) => {
  try {
    const workerId = req.user._id;
    const { coordinates, heading, speed, batteryLevel, activeBookingId } = req.body;

    if (!Array.isArray(coordinates) || coordinates.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Valid coordinates [longitude, latitude] are required.',
      });
    }

    const updatedLocation = await WorkerLocation.findOneAndUpdate(
      { worker: workerId },
      {
        $set: {
          location: {
            type: 'Point',
            coordinates: [Number(coordinates[0]), Number(coordinates[1])],
          },
          heading: heading || 0,
          speed: speed || 0,
          batteryLevel: batteryLevel || 100,
          isTrackingActive: true,
          updatedAt: new Date(),
        },
      },
      { new: true, upsert: true }
    );

    // If worker currently has an active in-flight booking, broadcast telemetry to customer
    if (activeBookingId) {
      const booking = await Booking.findById(activeBookingId);
      if (
        booking &&
        [BOOKING_STATES.ON_THE_WAY, BOOKING_STATES.ARRIVED, BOOKING_STATES.IN_PROGRESS].includes(booking.status)
      ) {
        const destCoords = booking.location?.coordinates || [77.2433, 28.5700];
        const distanceInfo = await getDistanceAndDuration(coordinates, destCoords);

        try {
          const io = getIO();
          const telemetryPayload = {
            bookingId: booking._id,
            workerLocation: sanitizeLocationForCustomer(coordinates),
            distanceKm: distanceInfo.distanceKm,
            durationMinutes: distanceInfo.durationMinutes,
            status: booking.status,
            timestamp: Date.now(),
          };

          io.to(`booking:${booking._id}`).emit('booking:worker_location', telemetryPayload);
          const custId = booking.customerId?.toString() || booking.customer?.toString();
          if (custId) {
            io.to(`customer:${custId}`).emit('booking:worker_location', telemetryPayload);
          }
        } catch (sockErr) {
          // Socket error non-fatal
        }
      }
    }

    res.status(200).json({
      success: true,
      message: 'Worker telemetry saved.',
      location: updatedLocation,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/bookings/:id/live-tracking
 * ⭐ Zero-Surveillance Privacy Guarded Live Route Tracking ⭐
 * - NEVER reveals worker location to customers before booking is accepted.
 * - NEVER reveals all workers on a public map.
 * - ONLY releases coordinates when booking is in active transit (ON_THE_WAY, ARRIVED, IN_PROGRESS).
 * - Sanitizes coordinates to ~100m precision to protect worker residence privacy.
 */
const getBookingLiveTracking = async (req, res, next) => {
  try {
    const { id } = req.params;
    const booking = await Booking.findById(id)
      .populate('customer', 'name phone')
      .populate('assignedWorker', 'name phone avatarUrl');

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    // Strict access verification (only assigned customer, assigned worker, or admin)
    verifyBookingAccess(booking, req.user);

    const activeStates = [
      BOOKING_STATES.ON_THE_WAY,
      BOOKING_STATES.ARRIVED,
      BOOKING_STATES.IN_PROGRESS,
    ];

    // Privacy Guardrail: Customer cannot see worker location before transit
    if (!activeStates.includes(booking.status)) {
      return res.status(200).json({
        success: true,
        status: booking.status,
        trackingAvailable: false,
        message: 'Live worker location telemetry is only active once worker begins transit (ON_THE_WAY).',
        customerDestination: booking.location?.coordinates || [77.2433, 28.5700],
      });
    }

    const workerId = booking.workerId || booking.assignedWorker?._id;
    if (!workerId) {
      return res.status(400).json({
        success: false,
        message: 'No worker assigned to this booking.',
      });
    }

    // Retrieve worker's latest location or fallback to base
    const [liveLoc, profile] = await Promise.all([
      WorkerLocation.findOne({ worker: workerId }),
      WorkerProfile.findOne({ user: workerId }),
    ]);

    const workerRawCoords =
      liveLoc?.location?.coordinates ||
      profile?.homeBaseLocation?.coordinates ||
      [77.2197, 28.6315];

    const destCoords = booking.location?.coordinates || [77.2433, 28.5700];
    const distanceInfo = await getDistanceAndDuration(workerRawCoords, destCoords);

    res.status(200).json({
      success: true,
      trackingAvailable: true,
      bookingNumber: booking.bookingNumber,
      status: booking.status,
      assignedWorker: {
        id: workerId,
        name: booking.assignedWorker?.name || 'Assigned Worker',
        avatarUrl: booking.assignedWorker?.avatarUrl,
      },
      workerLocation: sanitizeLocationForCustomer(workerRawCoords),
      destination: {
        addressLine: booking.address?.addressLine || 'Customer Address',
        coordinates: destCoords,
      },
      distanceKm: distanceInfo.distanceKm,
      durationMinutes: distanceInfo.durationMinutes,
      durationText: distanceInfo.durationText,
      source: distanceInfo.source,
      privacyNote: 'Worker coordinates are privacy-rounded to protect member security.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/bookings/:id/simulate-enroute
 * Live Demo En-Route GPS Waypoint Simulator:
 * Generates realistic interpolated route waypoints from worker to customer doorstep.
 * Broadcasts updates over Socket.io room `booking:{bookingId}` and customer room.
 */
const simulateEnRouteRoute = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { steps = 6 } = req.body;

    const booking = await Booking.findById(id).populate('assignedWorker', 'name phone avatarUrl');
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    verifyBookingAccess(booking, req.user);

    const workerId = booking.workerId || booking.assignedWorker?._id;
    const [liveLoc, profile] = await Promise.all([
      WorkerLocation.findOne({ worker: workerId }),
      WorkerProfile.findOne({ user: workerId }),
    ]);

    const startCoords =
      liveLoc?.location?.coordinates ||
      profile?.homeBaseLocation?.coordinates ||
      [77.2090, 28.6139]; // Default Central Delhi

    const endCoords = booking.location?.coordinates || [77.2433, 28.5700]; // Lajpat Nagar

    const waypoints = generateRouteWaypoints(startCoords, endCoords, Math.max(3, Math.min(15, Number(steps))));

    // Trigger asynchronous broadcast sequence over Socket.io
    try {
      const io = getIO();
      const bIdStr = booking._id.toString();
      const custIdStr = (booking.customerId || booking.customer)?.toString();

      let currentStepIdx = 0;
      const interval = setInterval(async () => {
        if (currentStepIdx >= waypoints.length) {
          clearInterval(interval);
          return;
        }

        const point = waypoints[currentStepIdx];
        const payload = {
          bookingId: booking._id,
          step: point.step,
          totalSteps: point.totalSteps,
          progressPercent: point.progressPercent,
          workerLocation: point.coordinates,
          distanceRemainingKm: point.distanceRemainingKm,
          etaMinutes: point.etaMinutes,
          isArrived: point.isArrived,
          status: point.isArrived ? BOOKING_STATES.ARRIVED : BOOKING_STATES.ON_THE_WAY,
        };

        io.to(`booking:${bIdStr}`).emit('booking:worker_location', payload);
        if (custIdStr) {
          io.to(`customer:${custIdStr}`).emit('booking:worker_location', payload);
        }

        // Update worker's current location to latest simulated waypoint
        if (workerId) {
          await WorkerLocation.findOneAndUpdate(
            { worker: workerId },
            {
              $set: {
                'location.coordinates': point.coordinates,
                updatedAt: new Date(),
              },
            },
            { upsert: true }
          );
        }

        currentStepIdx++;
      }, 1200); // Emits every 1.2 seconds for fluid visual demo
    } catch (sockErr) {
      console.warn('[GeoController] Socket.io broadcast notice:', sockErr.message);
    }

    res.status(200).json({
      success: true,
      message: `En-route GPS simulation initiated with ${waypoints.length} route waypoints.`,
      startLocation: startCoords,
      destination: endCoords,
      waypoints,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  handleGeocode,
  handleReverseGeocode,
  getWorkerServiceArea,
  updateWorkerServiceArea,
  reportWorkerLocation,
  getBookingLiveTracking,
  simulateEnRouteRoute,
};
