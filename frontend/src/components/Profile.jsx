import React, { useState, useEffect } from "react";
import { User, Mail, Phone, Target, Award, Camera, Save, CheckCircle, ArrowLeft, Loader2, Info } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000";

export default function Profile({ onBack }) {
    const { getAuthHeaders } = useAuth();
    const [profile, setProfile] = useState({
        name: "",
        email: "",
        bio: "",
        phone: "",
        learning_goal: "",
        skill_level: "Beginner",
        profile_pic: ""
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        fetchProfile();
    }, []);

    async function fetchProfile() {
        try {
            const res = await fetch(`${API_BASE}/user/profile`, {
                headers: getAuthHeaders(),
            });
            if (res.ok) {
                const data = await res.json();
                setProfile(data);
            }
        } catch (err) {
            console.error("Failed to fetch profile", err);
        } finally {
            setLoading(false);
        }
    }

    async function handleSave(e) {
        e.preventDefault();
        setSaving(true);
        setSuccess(false);
        try {
            const res = await fetch(`${API_BASE}/user/profile`, {
                method: "PUT",
                headers: {
                    ...getAuthHeaders(),
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(profile),
            });
            if (res.ok) {
                setSuccess(true);
                setTimeout(() => setSuccess(false), 3000);
            }
        } catch (err) {
            console.error("Failed to save profile", err);
        } finally {
            setSaving(false);
        }
    }

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setProfile(prev => ({ ...prev, [name]: value }));
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <Loader2 className="w-10 h-10 text-white animate-spin mb-4" />
                <p className="text-neutral-500 animate-pulse">Loading your profile...</p>
            </div>
        );
    }

    const calculateCompletion = () => {
        if (!profile) return 0;
        const fields = ['name', 'bio', 'phone', 'learning_goal', 'skill_level', 'profile_pic'];
        // Filter out fields that are meaningful. phone is optional but counts if filled.
        const filled = fields.filter(f => {
            if (f === 'skill_level') return true; // Always has a value
            return profile[f] && profile[f].toString().trim() !== '';
        }).length;
        return Math.round((filled / fields.length) * 100);
    };

    const completion = calculateCompletion();

    return (
        <div className="max-w-6xl mx-auto animate-fade-in pb-20">
            {/* Header with Navigation */}
            <div className="flex items-center justify-between mb-8">
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 text-neutral-400 hover:text-white transition-colors group"
                >
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    Back to Dashboard
                </button>
                {success && (
                    <div className="flex items-center gap-2 text-emerald-400 bg-emerald-400/10 px-4 py-2 rounded-full border border-emerald-400/20 animate-bounce-in">
                        <CheckCircle className="w-4 h-4" />
                        <span className="text-sm font-medium">Profile saved successfully!</span>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* LEFT COLUMN: Summary Card */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-neutral-900 border border-white/5 rounded-3xl p-8 sticky top-8">
                        <div className="flex flex-col items-center text-center">
                            <div className="relative group mb-6">
                                <div className="w-32 h-32 rounded-3xl bg-neutral-800 border-2 border-white/10 overflow-hidden flex items-center justify-center shadow-2xl transition-transform group-hover:scale-105">
                                    {profile.profile_pic ? (
                                        <img src={profile.profile_pic} alt="Profile" className="w-full h-full object-cover" />
                                    ) : (
                                        <User className="w-16 h-16 text-neutral-600" />
                                    )}
                                </div>
                                <button className="absolute -bottom-2 -right-2 w-10 h-10 bg-white text-black rounded-xl border-4 border-neutral-900 flex items-center justify-center hover:bg-neutral-200 transition-colors shadow-lg">
                                    <Camera className="w-4 h-4" />
                                </button>
                            </div>

                            <h2 className="text-2xl font-bold text-white mb-1">{profile.name || "Learning Pro"}</h2>
                            <p className="text-neutral-500 text-sm mb-6">{profile.email}</p>

                            <div className="w-full space-y-4 pt-6 border-t border-white/5">
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="text-neutral-400 font-medium">Profile Completion</span>
                                    <span className="text-white font-bold">{completion}%</span>
                                </div>
                                <div className="w-full h-2 bg-neutral-800 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-white transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(255,255,255,0.3)]"
                                        style={{ width: `${completion}%` }}
                                    ></div>
                                </div>
                                <p className="text-xs text-neutral-600 italic">
                                    Complete your profile to unlock personalized recommendations.
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-4 w-full mt-8">
                                <div className="bg-neutral-800/50 p-4 rounded-2xl border border-white/5">
                                    <Award className="w-5 h-5 text-neutral-400 mx-auto mb-2" />
                                    <span className="text-[10px] uppercase tracking-widest text-neutral-500 block">Level</span>
                                    <span className="text-xs font-bold text-white">{profile.skill_level}</span>
                                </div>
                                <div className="bg-neutral-800/50 p-4 rounded-2xl border border-white/5">
                                    <Target className="w-5 h-5 text-neutral-400 mx-auto mb-2" />
                                    <span className="text-[10px] uppercase tracking-widest text-neutral-500 block">Status</span>
                                    <span className="text-xs font-bold text-white">Active</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* RIGHT COLUMN: Edit Form */}
                <div className="lg:col-span-2 space-y-8">
                    <form onSubmit={handleSave} className="space-y-8">

                        {/* Personal Details Section */}
                        <div className="bg-neutral-900 border border-white/5 rounded-3xl p-8 md:p-10 shadow-xl overflow-hidden relative">
                            <div className="absolute top-0 left-0 w-1 h-full bg-white/20"></div>
                            <h3 className="text-xl font-bold text-white mb-8 flex items-center gap-3">
                                <User className="w-5 h-5 text-neutral-400" />
                                Personal Identity
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider ml-1">Full Name</label>
                                    <div className="relative group">
                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-600 group-focus-within:text-white transition-colors" />
                                        <input
                                            type="text"
                                            name="name"
                                            value={profile.name}
                                            onChange={handleInputChange}
                                            placeholder="Enter your full name"
                                            className="w-full bg-neutral-800 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-white placeholder-neutral-600 focus:outline-none focus:ring-2 focus:ring-white/10 transition-all text-sm"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2 opacity-70">
                                    <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider ml-1">Email (Primary)</label>
                                    <div className="relative">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-600" />
                                        <input
                                            type="email"
                                            value={profile.email}
                                            readOnly
                                            disabled
                                            className="w-full bg-neutral-800/50 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-neutral-500 cursor-not-allowed text-sm"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider ml-1">Phone Number</label>
                                    <div className="relative group">
                                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-600 group-focus-within:text-white transition-colors" />
                                        <input
                                            type="text"
                                            name="phone"
                                            value={profile.phone}
                                            onChange={handleInputChange}
                                            placeholder="+1 (555) 000-0000"
                                            className="w-full bg-neutral-800 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-white placeholder-neutral-600 focus:outline-none focus:ring-2 focus:ring-white/10 transition-all text-sm"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider ml-1">Skill Level</label>
                                    <div className="relative">
                                        <Award className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-600" />
                                        <select
                                            name="skill_level"
                                            value={profile.skill_level}
                                            onChange={handleInputChange}
                                            className="w-full bg-neutral-800 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-white/10 transition-all text-sm appearance-none cursor-pointer"
                                        >
                                            <option value="Beginner">Beginner</option>
                                            <option value="Intermediate">Intermediate</option>
                                            <option value="Advanced">Advanced</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6 space-y-2">
                                <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider ml-1">Short Bio</label>
                                <textarea
                                    name="bio"
                                    value={profile.bio}
                                    onChange={handleInputChange}
                                    placeholder="Tell us a bit about yourself..."
                                    className="w-full bg-neutral-800 border border-white/5 rounded-2xl p-4 text-white placeholder-neutral-600 focus:outline-none focus:ring-2 focus:ring-white/10 transition-all text-sm min-h-[120px] resize-none"
                                />
                            </div>
                        </div>

                        {/* Learning Goals Section */}
                        <div className="bg-neutral-900 border border-white/5 rounded-3xl p-8 md:p-10 shadow-xl overflow-hidden relative">
                            <div className="absolute top-0 left-0 w-1 h-full bg-white/20"></div>
                            <h3 className="text-xl font-bold text-white mb-8 flex items-center gap-3">
                                <Target className="w-5 h-5 text-neutral-400" />
                                Learning Ambition
                            </h3>

                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider ml-1">Main Learning Goal</label>
                                    <div className="relative group">
                                        <Target className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-600 group-focus-within:text-white transition-colors" />
                                        <input
                                            type="text"
                                            name="learning_goal"
                                            value={profile.learning_goal}
                                            onChange={handleInputChange}
                                            placeholder="e.g. Master React and Next.js this year"
                                            className="w-full bg-neutral-800 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-white placeholder-neutral-600 focus:outline-none focus:ring-2 focus:ring-white/10 transition-all text-sm"
                                        />
                                    </div>
                                </div>

                                <div className="bg-white/5 rounded-2xl p-6 border border-white/5 flex gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
                                        <Info className="w-5 h-5 text-neutral-400" />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold text-white mb-1">Why set a goal?</h4>
                                        <p className="text-xs text-neutral-500 leading-relaxed">
                                            Setting a specific goal helps our AI engine tailor course content and complexity to match your career or personal benchmarks.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center justify-end gap-4 pt-4">
                            <button
                                type="button"
                                onClick={onBack}
                                className="px-8 py-4 rounded-2xl border border-white/10 text-neutral-400 font-bold hover:bg-neutral-800 transition-all text-sm"
                            >
                                Discard Changes
                            </button>
                            <button
                                type="submit"
                                disabled={saving}
                                className="px-8 py-4 bg-white text-black rounded-2xl font-bold hover:bg-neutral-200 transition-all disabled:opacity-50 flex items-center gap-3 group relative overflow-hidden text-sm"
                            >
                                {saving ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <Save className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                )}
                                {saving ? "Optimizing..." : "Secure Save"}
                            </button>
                        </div>

                    </form>
                </div>

            </div>
        </div>
    );
}
