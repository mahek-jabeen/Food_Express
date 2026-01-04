import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

const Profile = () => {
  const { user, logout } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: ''
    }
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        phone: user.phone || '',
        address: user.address || {
          street: '',
          city: '',
          state: '',
          zipCode: ''
        }
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name.startsWith('address.')) {
      const addressField = name.split('.')[1];
      setFormData({
        ...formData,
        address: { ...formData.address, [addressField]: value }
      });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await api.put('/users/profile', formData);
      
      if (response.data.status === 'success') {
        // Update local storage
        const updatedUser = response.data.data.user;
        localStorage.setItem('user', JSON.stringify(updatedUser));
        
        setMessage({ type: 'success', text: 'Profile updated successfully!' });
        setIsEditing(false);
        
        // Refresh page to update user context
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      }
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to update profile' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition"
              >
                Edit Profile
              </button>
            )}
          </div>

          {message.text && (
            <div className={`mb-6 p-4 rounded-lg ${
              message.type === 'success' 
                ? 'bg-green-100 text-green-700 border border-green-400' 
                : 'bg-red-100 text-red-700 border border-red-400'
            }`}>
              {message.text}
            </div>
          )}

          {isEditing ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
                  required
                />
              </div>

              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Delivery Address</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Street Address
                    </label>
                    <input
                      type="text"
                      name="address.street"
                      value={formData.address.street}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        City
                      </label>
                      <input
                        type="text"
                        name="address.city"
                        value={formData.address.city}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        State
                      </label>
                      <input
                        type="text"
                        name="address.state"
                        value={formData.address.state}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        ZIP Code
                      </label>
                      <input
                        type="text"
                        name="address.zipCode"
                        value={formData.address.zipCode}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex space-x-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 transition disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    setMessage({ type: '', text: '' });
                  }}
                  className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Email</label>
                <p className="text-lg text-gray-900">{user?.email}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Full Name</label>
                <p className="text-lg text-gray-900">{user?.name}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Phone Number</label>
                <p className="text-lg text-gray-900">{user?.phone}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Role</label>
                <p className="text-lg text-gray-900 capitalize">{user?.role?.replace('_', ' ')}</p>
              </div>

              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Delivery Address</h3>
                {user?.address ? (
                  <p className="text-gray-700">
                    {user.address.street && `${user.address.street},`}<br />
                    {user.address.city && `${user.address.city}, `}
                    {user.address.state && `${user.address.state} `}
                    {user.address.zipCode}
                  </p>
                ) : (
                  <p className="text-gray-500 italic">No address provided</p>
                )}
              </div>

              <div className="border-t pt-6">
                <button
                  onClick={logout}
                  className="w-full bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 transition"
                >
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
