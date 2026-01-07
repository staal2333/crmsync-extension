import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'https://crmsync-api.onrender.com';

interface ChipInputProps {
  value: string[];
  onChange: (value: string[]) => void;
  placeholder: string;
}

const ChipInput: React.FC<ChipInputProps> = ({ value, onChange, placeholder }) => {
  const [inputValue, setInputValue] = useState('');

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const trimmed = inputValue.trim();
      if (trimmed && !value.includes(trimmed)) {
        onChange([...value, trimmed]);
        setInputValue('');
      }
    } else if (e.key === 'Backspace' && !inputValue && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  };

  const removeChip = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  return (
    <div style={{
      border: '2px solid #e5e7eb',
      borderRadius: '12px',
      padding: '12px',
      minHeight: '50px',
      display: 'flex',
      flexWrap: 'wrap',
      gap: '8px',
      alignItems: 'center',
      background: '#f9fafb'
    }}>
      {value.map((chip, index) => (
        <span
          key={index}
          style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            padding: '6px 12px',
            borderRadius: '20px',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          {chip}
          <button
            onClick={() => removeChip(index)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'white',
              cursor: 'pointer',
              padding: '0 2px',
              fontSize: '16px',
              lineHeight: '1'
            }}
          >
            ×
          </button>
        </span>
      ))}
      <input
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={value.length === 0 ? placeholder : ''}
        style={{
          border: 'none',
          outline: 'none',
          background: 'transparent',
          flex: 1,
          minWidth: '120px',
          fontSize: '15px',
          padding: '4px'
        }}
      />
    </div>
  );
};

export const Exclusions: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Form state
  const [excludeName, setExcludeName] = useState('');
  const [excludeEmail, setExcludeEmail] = useState('');
  const [excludePhone, setExcludePhone] = useState('');
  const [excludeCompany, setExcludeCompany] = useState('');
  const [excludeDomains, setExcludeDomains] = useState<string[]>([]);
  const [excludeEmails, setExcludeEmails] = useState<string[]>([]);
  const [ignoreSignatureMatches, setIgnoreSignatureMatches] = useState(true);
  const [ignoreInternalThreads, setIgnoreInternalThreads] = useState(true);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [existingData, setExistingData] = useState(false);

  useEffect(() => {
    // Pre-fill from user account if available
    if (user) {
      setExcludeName(`${user.firstName || ''} ${user.lastName || ''}`.trim());
      setExcludeEmail(user.email || '');
      
      // Try to fetch existing exclusions
      loadExistingExclusions();
    }
  }, [user]);

  const loadExistingExclusions = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await axios.get(`${API_URL}/api/users/exclusions`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = response.data;
      if (data.created_at) {
        // Has existing exclusions
        setExistingData(true);
        setExcludeName(data.exclude_name || '');
        setExcludeEmail(data.exclude_email || '');
        setExcludePhone(data.exclude_phone || '');
        setExcludeCompany(data.exclude_company || '');
        setExcludeDomains(data.exclude_domains || []);
        setExcludeEmails(data.exclude_emails || []);
        setIgnoreSignatureMatches(data.ignore_signature_matches !== false);
        setIgnoreInternalThreads(data.ignore_internal_threads !== false);
      }
    } catch (err) {
      console.log('No existing exclusions found');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Not authenticated');
      }

      await axios.post(`${API_URL}/api/users/exclusions`, {
        exclude_name: excludeName,
        exclude_email: excludeEmail,
        exclude_phone: excludePhone,
        exclude_company: excludeCompany,
        exclude_domains: excludeDomains,
        exclude_emails: excludeEmails,
        ignore_signature_matches: ignoreSignatureMatches,
        ignore_internal_threads: ignoreInternalThreads
      }, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      // Navigate to install extension page
      navigate('/install');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save exclusions');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    navigate('/install');
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 20px'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '24px',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
        maxWidth: '800px',
        width: '100%',
        padding: '60px 80px'
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{
            width: '80px',
            height: '80px',
            margin: '0 auto 24px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '40px'
          }}>
            🛡️
          </div>
          <h1 style={{
            fontSize: '32px',
            fontWeight: 700,
            marginBottom: '16px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            Tell us who to ignore
          </h1>
          <p style={{
            fontSize: '16px',
            color: '#64748b',
            lineHeight: '1.6'
          }}>
            We'll use this to avoid tracking you, your team, and internal emails. These exclusions are saved to your CRM-Sync account and follow you on every device.
          </p>
          {existingData && (
            <div style={{
              marginTop: '16px',
              padding: '12px',
              background: '#f0f9ff',
              border: '1px solid #bae6fd',
              borderRadius: '8px',
              fontSize: '14px',
              color: '#075985'
            }}>
              ℹ️ We loaded your saved exclusions. Changes here will apply on all devices.
            </div>
          )}
        </div>
        </div>

        {error && (
          <div style={{
            padding: '16px',
            background: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '12px',
            color: '#991b1b',
            marginBottom: '24px',
            fontSize: '14px'
          }}>
            ❌ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          {/* Section 1: Your Identity */}
          <div>
            <h3 style={{
              fontSize: '18px',
              fontWeight: 600,
              color: '#1e293b',
              marginBottom: '16px'
            }}>
              1. Your identity
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500, color: '#1e293b' }}>
                  Name
                </label>
                <input
                  type="text"
                  value={excludeName}
                  onChange={(e) => setExcludeName(e.target.value)}
                  placeholder="John Doe"
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '12px',
                    fontSize: '15px',
                    background: '#f9fafb'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500, color: '#1e293b' }}>
                  Email
                </label>
                <input
                  type="email"
                  value={excludeEmail}
                  onChange={(e) => setExcludeEmail(e.target.value)}
                  placeholder="john@company.com"
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '12px',
                    fontSize: '15px',
                    background: '#f9fafb'
                  }}
                />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500, color: '#1e293b' }}>
                  Phone number (optional)
                </label>
                <input
                  type="tel"
                  value={excludePhone}
                  onChange={(e) => setExcludePhone(e.target.value)}
                  placeholder="+1 234 567 8900"
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '12px',
                    fontSize: '15px',
                    background: '#f9fafb'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500, color: '#1e293b' }}>
                  Company name (optional)
                </label>
                <input
                  type="text"
                  value={excludeCompany}
                  onChange={(e) => setExcludeCompany(e.target.value)}
                  placeholder="Acme Corp"
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '12px',
                    fontSize: '15px',
                    background: '#f9fafb'
                  }}
                />
              </div>
            </div>
          </div>

          {/* Section 2: Team / Internal Emails */}
          <div>
            <h3 style={{
              fontSize: '18px',
              fontWeight: 600,
              color: '#1e293b',
              marginBottom: '16px'
            }}>
              2. Team / internal emails
            </h3>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500, color: '#1e293b' }}>
                Ignore these email domains
              </label>
              <ChipInput
                value={excludeDomains}
                onChange={setExcludeDomains}
                placeholder="e.g. @yourcompany.com"
              />
              <p style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                Press Enter or comma to add. Example: @yourcompany.com
              </p>
            </div>
            <div style={{ marginTop: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500, color: '#1e293b' }}>
                Ignore specific email addresses (optional)
              </label>
              <ChipInput
                value={excludeEmails}
                onChange={setExcludeEmails}
                placeholder="e.g. ceo@yourcompany.com, hr@yourcompany.com"
              />
              <p style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                Press Enter or comma to add individual email addresses
              </p>
            </div>
          </div>

          {/* Section 3: Behavior Toggles */}
          <div>
            <h3 style={{
              fontSize: '18px',
              fontWeight: 600,
              color: '#1e293b',
              marginBottom: '16px'
            }}>
              3. Behavior settings
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '16px',
                background: '#f9fafb',
                borderRadius: '12px',
                cursor: 'pointer'
              }}>
                <input
                  type="checkbox"
                  checked={ignoreSignatureMatches}
                  onChange={(e) => setIgnoreSignatureMatches(e.target.checked)}
                  style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                />
                <span style={{ fontSize: '15px', color: '#1e293b' }}>
                  Ignore emails that match my own signature details
                </span>
              </label>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '16px',
                background: '#f9fafb',
                borderRadius: '12px',
                cursor: 'pointer'
              }}>
                <input
                  type="checkbox"
                  checked={ignoreInternalThreads}
                  onChange={(e) => setIgnoreInternalThreads(e.target.checked)}
                  style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                />
                <span style={{ fontSize: '15px', color: '#1e293b' }}>
                  Ignore threads where all participants are from ignored domains
                </span>
              </label>
            </div>
          </div>

          {/* Buttons */}
          <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
            <button
              type="submit"
              disabled={loading}
              style={{
                flex: 1,
                padding: '16px 24px',
                borderRadius: '12px',
                fontSize: '15px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                border: 'none',
                background: loading ? '#cbd5e1' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)'
              }}
            >
              {loading ? 'Saving...' : 'Save exclusions'}
            </button>
          </div>
          <div style={{ textAlign: 'center', marginTop: '8px' }}>
            <button
              type="button"
              onClick={handleSkip}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#64748b',
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: 500,
                cursor: 'pointer'
              }}
            >
              Skip (I'll configure later)
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Exclusions;
