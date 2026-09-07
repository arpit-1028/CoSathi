import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { User, Phone, Mail, Lock, MapPin, ArrowRight, AlertCircle } from 'lucide-react';

export const INDIAN_CITIES = [
  'Delhi NCR',
  'New Delhi',
  'Noida',
  'Greater Noida',
  'Ghaziabad',
  'Gurgaon (Gurugram)',
  'Faridabad',
  'Mumbai',
  'Pune',
  'Bengaluru',
  'Hyderabad',
  'Chennai',
  'Kolkata',
  'Ahmedabad',
  'Jaipur',
  'Lucknow',
  'Kanpur',
  'Patna',
  'Bhopal',
  'Indore',
  'Chandigarh',
  'Meerut',
  'Agra',
  'Varanasi',
  'Surat',
  'Vadodara',
  'Nagpur',
  'Nashik',
  'Kochi',
  'Coimbatore',
  'Dehradun',
  'Ranchi',
  'Guwahati',
  'Amritsar',
  'Prayagraj',
];

export const CustomerRegister = () => {
  const { register } = useAuth();
  const { t, language } = useLanguage();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    password: '',
    city: 'New Delhi',
    role: 'customer',
    preferredLanguage: language,
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // 1. Phone number validation (strictly 10 digits)
    const cleanPhone = formData.phone.trim().replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      setError(language === 'hi' ? 'कृपया सही 10-अंकों का मोबाइल नंबर दर्ज करें।' : 'Mobile number must be exactly 10 digits.');
      return;
    }

    // 2. Password validation (minimum 6 characters)
    if (formData.password.length < 6) {
      setError(language === 'hi' ? 'पासवर्ड कम से कम 6 अक्षरों का होना चाहिए।' : 'Password must be at least 6 characters long.');
      return;
    }

    // 3. City validation (Only valid Indian cities)
    if (!formData.city || !INDIAN_CITIES.includes(formData.city)) {
      setError(language === 'hi' ? 'कृपया सूची से एक मान्य भारतीय शहर चुनें।' : 'Please select a valid Indian city from the list.');
      return;
    }

    setLoading(true);

    const payload = {
      ...formData,
      phone: cleanPhone,
      address: formData.city,
    };

    const res = await register(payload);
    setLoading(false);

    if (res.success) {
      navigate('/customer/home');
    } else {
      setError(res.message);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 py-8">
      <div className="bg-white max-w-lg w-full rounded-3xl p-6 sm:p-8 border border-cosathi-border shadow-sm">
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-cosathi-clay text-white font-bold flex items-center justify-center mx-auto mb-3 text-2xl shadow">
            सह
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-cosathi-slate">
            {t('auth.customerRegisterTitle')}
          </h2>
          <p className="text-xs sm:text-sm text-cosathi-muted mt-1">
            {t('auth.customerRegisterSubtitle')}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-cosathi-muted uppercase mb-1">
              {t('auth.fullName')}
            </label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3.5 top-3 text-cosathi-muted" />
              <input
                type="text"
                required
                name="name"
                placeholder="e.g. Pooja Verma"
                value={formData.name}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-cosathi-border focus:outline-none focus:border-cosathi-clay bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-cosathi-muted uppercase mb-1">
                {t('auth.phone')} (10 Digits)
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 absolute left-3.5 top-3 text-cosathi-muted" />
                <input
                  type="tel"
                  required
                  maxLength={10}
                  name="phone"
                  placeholder="10 digit number"
                  value={formData.phone}
                  onChange={(e) => {
                    const onlyNums = e.target.value.replace(/\D/g, '');
                    setFormData({ ...formData, phone: onlyNums });
                  }}
                  className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-cosathi-border focus:outline-none focus:border-cosathi-clay bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-cosathi-muted uppercase mb-1">
                {t('auth.emailLabel')} (Optional)
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-3 text-cosathi-muted" />
                <input
                  type="email"
                  name="email"
                  placeholder="name@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-cosathi-border focus:outline-none focus:border-cosathi-clay bg-white"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-cosathi-muted uppercase mb-1">
              {t('auth.passwordLabel')} (Min. 6 Characters)
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-3 text-cosathi-muted" />
              <input
                type="password"
                required
                minLength={6}
                name="password"
                placeholder="Minimum 6 characters"
                value={formData.password}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-cosathi-border focus:outline-none focus:border-cosathi-clay bg-white"
              />
            </div>
          </div>

          {/* Service City Dropdown (Only Valid Indian Cities) */}
          <div>
            <label className="block text-xs font-semibold text-cosathi-muted uppercase mb-1">
              Service City / सेवा शहर (India)
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 absolute left-3.5 top-3 text-cosathi-muted pointer-events-none" />
              <select
                required
                name="city"
                value={formData.city}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-cosathi-border focus:outline-none focus:border-cosathi-clay bg-white text-[#20242A] appearance-none"
              >
                {INDIAN_CITIES.map((cityName) => (
                  <option key={cityName} value={cityName}>
                    {cityName}
                  </option>
                ))}
              </select>
            </div>
            <span className="text-[10px] text-cosathi-muted mt-1 block">
              Only verified cooperative service cities in India are eligible.
            </span>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-cosathi-clay hover:bg-cosathi-clay-light text-white font-bold rounded-xl text-sm transition-all shadow-md flex items-center justify-center space-x-2"
          >
            <span>{loading ? t('common.loading') : t('auth.submitRegistration')}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-cosathi-border/60 text-center text-xs text-cosathi-muted">
          <Link to="/login" className="font-bold text-cosathi-clay hover:underline">
            {t('auth.alreadyHaveAccount')}
          </Link>
        </div>
      </div>
    </div>
  );
};
