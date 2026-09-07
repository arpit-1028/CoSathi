const mongoose = require('mongoose');

const disputeSchema = new mongoose.Schema(
  {
    disputeTicketNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: true,
      index: true,
    },
    raisedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    againstUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    disputeCategory: {
      type: String,
      enum: [
        'billing',
        'quality',
        'behavior',
        'incomplete service',
        'pricing_disagreement',
        'poor_quality',
        'no_show',
        'safety_conduct',
        'damage',
        'other',
      ],
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    evidence: {
      voiceTranscript: {
        type: String,
        default: '',
      },
      aiExtractedWork: {
        type: [mongoose.Schema.Types.Mixed],
        default: [],
      },
      rateCardSnapshot: {
        type: mongoose.Schema.Types.Mixed,
        default: null,
      },
      bill: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Bill',
      },
      photos: {
        type: [String],
        default: [],
      },
      review: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Review',
      },
    },
    evidenceUrls: [String],
    aiEvidenceSummary: {
      summary: {
        type: String,
        default: '',
      },
      keyFacts: {
        type: [String],
        default: [],
      },
      discrepancies: {
        type: [String],
        default: [],
      },
      disclaimer: {
        type: String,
        default:
          'AI organizes and synthesizes evidence strictly for human arbitrator assistance. AI does not and must not make the final decision.',
      },
      analyzedAt: Date,
    },
    status: {
      type: String,
      enum: [
        'raised',
        'under_cooperative_review',
        'mediation_in_progress',
        'resolved_settlement',
        'resolved_refund',
        'resolved_dismissed',
        'resolved',
        'dismissed',
      ],
      default: 'raised',
      index: true,
    },
    adminDecision: {
      action: {
        type: String,
        enum: [
          'no_action',
          'partial_refund',
          'full_refund',
          'rework',
          'warning',
          'suspend',
          'pending',
        ],
        default: 'pending',
      },
      notes: String,
      refundAmount: {
        type: Number,
        default: 0,
      },
      warningReason: String,
      decidedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      decidedAt: Date,
      auditLogId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AuditLog',
      },
    },
    resolutionNotes: String,
    resolvedByAdmin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    resolvedAt: Date,
    refundAmount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

disputeSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('Dispute', disputeSchema);
