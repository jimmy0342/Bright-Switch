
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
// Added Image as ImageIcon to imports to resolve "Cannot find name 'ImageIcon'" error
import { User as UserIcon, Settings, Trash2, Save, X, Mail, Shield, Calendar, Camera, Loader2, AlertCircle, Image as ImageIcon, CircleDollarSign, Briefcase, Users, Zap, MapPin, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ImageUploader } from '../components/ImageUploader';
import { db } from '../services/firebase';
import { doc, getDoc, setDoc, query, where, getDocs, collection } from 'firebase/firestore';

export const MyAccountPage: React.FC = () => {
  const { user, updateUserProfile, deleteAccount, logout } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [perDayCharge, setPerDayCharge] = useState<string>(''); // For electrician only
  const [specializations, setSpecializations] = useState<string>(''); // For electrician only, comma separated
  const [teamSize, setTeamSize] = useState<string>('');
  const [yearsExperience, setYearsExperience] = useState<string>('');
  const [businessName, setBusinessName] = useState<string>('');
  const [businessAddress, setBusinessAddress] = useState<string>('');
  const [serviceAreas, setServiceAreas] = useState<string>(''); // Comma separated for now in settings
  const [pecNumber, setPecNumber] = useState<string>('');
  const [licenseNumber, setLicenseNumber] = useState<string>('');
  const [licenseExpiry, setLicenseExpiry] = useState<string>('');
  const [cnic, setCnic] = useState<string>('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [newPhotoURL, setNewPhotoURL] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();

  React.useEffect(() => {
    const fetchElectricianProfile = async () => {
      if (user?.role === 'electrician' && user?.uid) {
        try {
          // 1. Try Direct Doc ID match (Permanent promotion)
          const docRef = doc(db, 'electricians', user.uid);
          let docSnap = await getDoc(docRef);

          // 2. Fallback to userId field query (if Doc ID is still temporary)
          if (!docSnap.exists()) {
            const q = query(collection(db, 'electricians'), where('userId', '==', user.uid));
            const snap = await getDocs(q);
            if (!snap.empty) {
              docSnap = snap.docs[0];
            }
          }

          // 3. Fallback to Email (for first-time migrations)
          if (!docSnap.exists() && user.email) {
            const eq = query(collection(db, 'electricians'), where('email', '==', user.email.toLowerCase()));
            const emailSnap = await getDocs(eq);
            if (!emailSnap.empty) {
              docSnap = emailSnap.docs[0];
            }
          }

          if (docSnap && docSnap.exists()) {
            const data = docSnap.data();
            if (data.perDayCharge) {
              setPerDayCharge(data.perDayCharge.toString());
            }
            if (data.specializations) {
              setSpecializations(Array.isArray(data.specializations) ? data.specializations.join(', ') : data.specializations);
            }
            if (data.teamSize) setTeamSize(data.teamSize.toString());
            if (data.yearsExperience) setYearsExperience(data.yearsExperience.toString());
            if (data.businessName || data.companyName) setBusinessName(data.businessName || data.companyName);
            if (data.businessAddress) setBusinessAddress(data.businessAddress);
            if (data.serviceAreas) {
              setServiceAreas(Array.isArray(data.serviceAreas) ? data.serviceAreas.join(', ') : data.serviceAreas);
            }
            if (data.pecNumber) setPecNumber(data.pecNumber);
            if (data.licenseNumber) setLicenseNumber(data.licenseNumber);
            if (data.licenseExpiry) setLicenseExpiry(data.licenseExpiry);
            if (data.cnic) setCnic(data.cnic);
          }
        } catch (e) {
          console.error("Failed to fetch electrician profile data", e);
        }
      }
    };
    fetchElectricianProfile();
  }, [user]);

  if (!user) return null;

  const handleUpdate = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await updateUserProfile({
        name,
        photoURL: newPhotoURL || user.photoURL
      });

      // Update Electrician profile if needed
      if (user.role === 'electrician') {
        const eDocRef = doc(db, 'electricians', user.uid);
        const electricianData: any = {
          updatedAt: Date.now(),
          fullName: name // Sync name to electrician profile
        };

        if (perDayCharge !== '') {
          electricianData.perDayCharge = Number(perDayCharge);
        }

        if (specializations !== '') {
          electricianData.specializations = specializations.split(',').map(s => s.trim()).filter(s => s !== '');
        }

        if (teamSize !== '') electricianData.teamSize = Number(teamSize);
        if (yearsExperience !== '') electricianData.yearsExperience = Number(yearsExperience);
        if (businessName !== '') electricianData.businessName = businessName;
        if (businessAddress !== '') electricianData.businessAddress = businessAddress;
        if (serviceAreas !== '') {
          electricianData.serviceAreas = serviceAreas.split(',').map(s => s.trim()).filter(s => s !== '');
        }
        if (pecNumber !== '') electricianData.pecNumber = pecNumber;
        if (licenseNumber !== '') electricianData.licenseNumber = licenseNumber;
        if (licenseExpiry !== '') electricianData.licenseExpiry = licenseExpiry;
        if (cnic !== '') electricianData.cnic = cnic;

        await setDoc(eDocRef, electricianData, { merge: true });
      }

      setIsEditing(false);
      setNewPhotoURL(null);
    } catch (err: any) {
      console.error(err);
      setError('Failed to update profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('WARNING: This will permanently delete your account and history. Continue?')) return;

    setIsDeleting(true);
    setError(null);
    try {
      await deleteAccount();
      navigate('/');
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/requires-recent-login') {
        setError('Security check: Please log out and log back in to verify your identity before deleting.');
      } else {
        setError('System error: Failed to delete account.');
      }
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 text-left">
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start space-x-3 text-red-600 animate-in fade-in slide-in-from-top-4">
          <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <span className="text-sm font-bold">{error}</span>
          <button onClick={() => setError(null)} className="ml-auto hover:bg-red-100 p-1 rounded">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="bg-white rounded-[2.5rem] shadow-2xl border overflow-hidden text-left">
        <div className="h-40 bg-gradient-to-r from-blue-700 via-blue-600 to-blue-500"></div>

        <div className="px-10 pb-10">
          <div className="relative -mt-20 mb-8 flex justify-between items-end">
            <div className="relative">
              <div className="w-40 h-40 rounded-[2.5rem] bg-white p-2 shadow-2xl">
                <div className="w-full h-full rounded-[2rem] bg-gray-50 flex items-center justify-center overflow-hidden border border-gray-100">
                  {newPhotoURL || user.photoURL ? (
                    <img src={newPhotoURL || user.photoURL} alt={user.name} className="w-full h-full object-cover" />
                  ) : (
                    <UserIcon className="h-16 w-16 text-gray-200" />
                  )}
                </div>
              </div>
            </div>

            <div className="flex space-x-3 mb-2">
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="bg-white text-gray-900 border border-gray-100 px-6 py-3 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center hover:bg-gray-50 transition-all shadow-lg"
                >
                  <Settings className="h-4 w-4 mr-2" /> Settings
                </button>
              ) : (
                <div className="flex space-x-2">
                  <button
                    onClick={() => { setIsEditing(false); setNewPhotoURL(null); setName(user.name); }}
                    className="bg-gray-100 text-gray-700 px-6 py-3 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center hover:bg-gray-200 transition-all"
                  >
                    <X className="h-4 w-4 mr-2" /> Cancel
                  </button>
                  <button
                    onClick={handleUpdate}
                    disabled={isLoading}
                    className="bg-blue-600 text-white px-8 py-3 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center hover:bg-blue-700 disabled:opacity-50 transition-all shadow-xl shadow-blue-100"
                  >
                    {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                    {isLoading ? 'Saving' : 'Save'}
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-10">
            <div className="grid md:grid-cols-2 gap-12">
              <div className="space-y-8">
                <div>
                  <h2 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-6">Profile Configuration</h2>

                  {isEditing ? (
                    <div className="space-y-6">
                      <ImageUploader
                        onUploadSuccess={(res) => setNewPhotoURL(res.imageUrl)}
                        label="Profile Avatar (IMGBB)"
                        previewUrl={newPhotoURL || user.photoURL}
                      />

                      <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Full Identity Name</label>
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="w-full bg-gray-50 border-gray-100 border-2 rounded-2xl px-5 py-3 outline-none focus:border-blue-600 font-black text-gray-900 transition-all"
                          placeholder="Your Name"
                        />
                      </div>

                      {user.role === 'electrician' && (
                        <div className="space-y-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Company Name</label>
                              <input
                                type="text"
                                value={businessName}
                                onChange={(e) => setBusinessName(e.target.value)}
                                className="w-full bg-gray-50 border-gray-100 border-2 rounded-2xl px-5 py-3 outline-none focus:border-blue-600 font-black text-gray-900 transition-all"
                                placeholder="e.g. Ali Electrical"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Per Day Charge (Rs.)</label>
                              <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-gray-400 text-sm">Rs.</span>
                                <input
                                  type="number"
                                  value={perDayCharge}
                                  onChange={(e) => setPerDayCharge(e.target.value)}
                                  className="w-full bg-gray-50 border-gray-100 border-2 rounded-2xl pl-12 pr-5 py-3 outline-none focus:border-blue-600 font-black text-gray-900 transition-all"
                                  placeholder="e.g. 5000"
                                />
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Years Experience</label>
                              <input
                                type="number"
                                value={yearsExperience}
                                onChange={(e) => setYearsExperience(e.target.value)}
                                className="w-full bg-gray-50 border-gray-100 border-2 rounded-2xl px-5 py-3 outline-none focus:border-blue-600 font-black text-gray-900 transition-all"
                                placeholder="8"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Team Size</label>
                              <input
                                type="number"
                                value={teamSize}
                                onChange={(e) => setTeamSize(e.target.value)}
                                className="w-full bg-gray-50 border-gray-100 border-2 rounded-2xl px-5 py-3 outline-none focus:border-blue-600 font-black text-gray-900 transition-all"
                                placeholder="1"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Business Address</label>
                            <input
                              type="text"
                              value={businessAddress}
                              onChange={(e) => setBusinessAddress(e.target.value)}
                              className="w-full bg-gray-50 border-gray-100 border-2 rounded-2xl px-5 py-3 outline-none focus:border-blue-600 font-black text-gray-900 transition-all"
                              placeholder="Shop Address"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Service Areas (Comma Separated)</label>
                            <input
                              type="text"
                              value={serviceAreas}
                              onChange={(e) => setServiceAreas(e.target.value)}
                              className="w-full bg-gray-50 border-gray-100 border-2 rounded-2xl px-5 py-3 outline-none focus:border-blue-600 font-black text-gray-900 transition-all"
                              placeholder="e.g. Peshawar, Nowshera"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Specializations (Comma Separated)</label>
                            <input
                              type="text"
                              value={specializations}
                              onChange={(e) => setSpecializations(e.target.value)}
                              className="w-full bg-gray-50 border-gray-100 border-2 rounded-2xl px-5 py-3 outline-none focus:border-blue-600 font-black text-gray-900 transition-all"
                              placeholder="e.g. Solar Panel Installation, Wiring, Lighting"
                            />
                            <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-tight">List your core skills for customer identification.</p>
                          </div>

                          <div className="pt-6 border-t border-gray-100">
                            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-6">Professional Credentials</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">PEC Number</label>
                                <input
                                  type="text"
                                  value={pecNumber}
                                  onChange={(e) => setPecNumber(e.target.value)}
                                  className="w-full bg-gray-50 border-gray-100 border-2 rounded-2xl px-5 py-3 outline-none focus:border-blue-600 font-black text-gray-900 transition-all"
                                  placeholder="PEC-12345"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">License Number</label>
                                <input
                                  type="text"
                                  value={licenseNumber}
                                  onChange={(e) => setLicenseNumber(e.target.value)}
                                  className="w-full bg-gray-50 border-gray-100 border-2 rounded-2xl px-5 py-3 outline-none focus:border-blue-600 font-black text-gray-900 transition-all"
                                  placeholder="LIC-67890"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">License Expiry</label>
                                <input
                                  type="date"
                                  value={licenseExpiry}
                                  onChange={(e) => setLicenseExpiry(e.target.value)}
                                  className="w-full bg-gray-50 border-gray-100 border-2 rounded-2xl px-5 py-3 outline-none focus:border-blue-600 font-black text-gray-900 transition-all"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">CNIC Number</label>
                                <input
                                  type="text"
                                  value={cnic}
                                  onChange={(e) => setCnic(e.target.value)}
                                  className="w-full bg-gray-50 border-gray-100 border-2 rounded-2xl px-5 py-3 outline-none focus:border-blue-600 font-black text-gray-900 transition-all"
                                  placeholder="13 Digit ID"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-5 text-left">
                      <div className="flex items-center space-x-5">
                        <div className="p-4 bg-blue-50 rounded-2xl text-blue-600 border border-blue-100">
                          <UserIcon className="h-6 w-6" />
                        </div>
                        <div className="text-left">
                          <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Public Name</p>
                          <p className="font-black text-xl text-gray-900">{user.name}</p>
                        </div>
                      </div>

                      {user.role === 'electrician' && (
                        <>
                          <div className="flex items-center space-x-5 text-left">
                            <div className="p-4 bg-green-50 rounded-2xl text-green-600 border border-green-100">
                              <CircleDollarSign className="h-6 w-6" />
                            </div>
                            <div className="text-left">
                              <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Daily Rate</p>
                              <p className="font-black text-xl text-gray-900">Rs. {perDayCharge || 'Not Set'}</p>
                            </div>
                          </div>

                          <div className="flex items-center space-x-5 text-left">
                            <div className="p-4 bg-orange-50 rounded-2xl text-orange-600 border border-orange-100">
                              <Briefcase className="h-6 w-6" />
                            </div>
                            <div className="text-left">
                              <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Specializations</p>
                              <div className="flex flex-wrap gap-2 mt-1">
                                {specializations ? specializations.split(',').map(s => (
                                  <span key={s} className="px-3 py-1 bg-gray-100 rounded-lg text-[10px] font-black uppercase tracking-wider text-gray-600">
                                    {s.trim()}
                                  </span>
                                )) : <p className="font-bold text-gray-900">None Specified</p>}
                              </div>
                            </div>
                          </div>
                        </>
                      )}

                      <div className="flex items-center space-x-5 text-left">
                        <div className="p-4 bg-gray-50 rounded-2xl text-gray-400 border border-gray-100">
                          <Mail className="h-6 w-6" />
                        </div>
                        <div className="text-left">
                          <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Verified Email</p>
                          <p className="font-bold text-gray-900">{user.email}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {user.role === 'electrician' && !isEditing && (
                  <div className="pt-8 border-t border-gray-100">
                    <h2 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-6">Business Profile</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-6">
                        <div className="flex items-center space-x-4">
                          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                            <Briefcase size={20} />
                          </div>
                          <div>
                            <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Company</p>
                            <p className="font-bold text-gray-900">{businessName || 'Independent'}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                            <Star size={20} />
                          </div>
                          <div>
                            <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Experience</p>
                            <p className="font-bold text-gray-900">{yearsExperience || '0'} Years Professional</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                            <Users size={20} />
                          </div>
                          <div>
                            <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Team Capacity</p>
                            <p className="font-bold text-gray-900">{teamSize || '1'} Personnel</p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-6">
                        <div className="flex items-center space-x-4">
                          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                            <MapPin size={20} />
                          </div>
                          <div>
                            <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Service Operating Zones</p>
                            <div className="flex flex-wrap gap-2 mt-1">
                              {serviceAreas ? serviceAreas.split(',').map(a => (
                                <span key={a} className="px-3 py-1 bg-blue-50 text-blue-700 rounded-lg text-[10px] font-black uppercase">
                                  {a.trim()}
                                </span>
                              )) : <p className="font-bold text-gray-900 text-sm">Global</p>}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-start space-x-4">
                          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                            <Zap size={20} />
                          </div>
                          <div>
                            <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Business Address</p>
                            <p className="font-bold text-gray-900 text-sm line-clamp-2">{businessAddress || 'Not Provided'}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="text-left">
                <h2 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-6 text-left">Security Metadata</h2>
                <div className="space-y-5 text-left">
                  <div className="flex items-center space-x-5">
                    <div className="p-4 bg-purple-50 rounded-2xl text-purple-600 border border-purple-100">
                      <Shield className="h-6 w-6" />
                    </div>
                    <div className="text-left">
                      <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Access Privilege</p>
                      <span className="inline-block px-3 py-1 bg-purple-600 text-white rounded-lg text-[10px] font-black uppercase tracking-[0.1em] mt-1 shadow-md shadow-purple-100">
                        {user.role} Member
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-5">
                    <div className="p-4 bg-orange-50 rounded-2xl text-orange-600 border border-orange-100">
                      <Calendar className="h-6 w-6" />
                    </div>
                    <div className="text-left">
                      <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Enrollment Date</p>
                      <p className="font-black text-gray-900">
                        {new Date(user.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                      </p>
                    </div>
                  </div>

                  {user.role === 'electrician' && (
                    <div className="pt-6 mt-6 border-t border-gray-100 space-y-4">
                      <div className="flex items-center space-x-3">
                        <Shield className="h-4 w-4 text-blue-600" />
                        <div>
                          <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">PEC Certification</p>
                          <p className="text-sm font-bold text-gray-900">{pecNumber || 'No Data'}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Shield className="h-4 w-4 text-blue-600" />
                        <div>
                          <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Trade License</p>
                          <p className="text-sm font-bold text-gray-900">{licenseNumber || 'No Data'} (Exp: {licenseExpiry || 'N/A'})</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <UserIcon className="h-4 w-4 text-blue-600" />
                        <div>
                          <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Identity (CNIC)</p>
                          <p className="text-sm font-bold text-gray-900">{cnic || 'No Data'}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-8">
              <div className="bg-gray-900 rounded-[2.5rem] p-8 text-left shadow-2xl relative overflow-hidden">
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-600/10 rounded-full blur-3xl"></div>
                <h2 className="text-sm font-black text-white uppercase tracking-widest mb-4">Account Terminal</h2>
                <p className="text-sm text-gray-400 mb-8 leading-relaxed font-medium">
                  Critical account actions. Deletion is irreversible and removes all cloud-hosted credentials.
                </p>
                <div className="space-y-4">
                  <button
                    onClick={() => logout()}
                    className="w-full bg-white/5 border border-white/10 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-white/10 transition-all flex items-center justify-center"
                  >
                    Sign Out
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="w-full bg-red-600/10 border border-red-500/20 text-red-500 py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-red-600 hover:text-white transition-all flex items-center justify-center disabled:opacity-50"
                  >
                    {isDeleting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Trash2 className="h-4 w-4 mr-2" />}
                    {isDeleting ? 'Deleting' : 'Delete Identity'}
                  </button>
                </div>
              </div>

              <div className="p-6 bg-blue-50 rounded-3xl border border-blue-100 flex items-center space-x-4">
                <div className="bg-blue-600 p-3 rounded-2xl text-white">
                  <ImageIcon className="h-5 w-5" />
                </div>
                <div className="text-left">
                  <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Image Hosting</p>
                  <p className="text-sm font-bold text-blue-900">Connected to IMGBB Secure Node</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
