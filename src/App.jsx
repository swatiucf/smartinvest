// App.jsx - SmartInvest Frontend Application
import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged 
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc 
} from 'firebase/firestore';

// Firebase configuration (replace with your actual config)
const firebaseConfig = {
 apiKey: "AIzaSyCAjIoXbjrjRH48cHyDXjAYHUcW8PHXAx8",
  authDomain: "smartinvest-9e3e0.firebaseapp.com",
  projectId: "smartinvest-9e3e0",
  storageBucket: "smartinvest-9e3e0.firebasestorage.app",
  messagingSenderId: "406256776152",
  appId: "1:406256776152:web:c2bd0860b696bff5af78ad",
  measurementId: "G-F8ERS0RG27"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const API_BASE_URL = 'http://localhost:5000/api';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('login');
  const [profile, setProfile] = useState(null);

  // Auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        await loadUserProfile(currentUser.uid);
        setView('dashboard');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loadUserProfile = async (uid) => {
    try {
      const docRef = doc(db, 'users', uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setProfile(docSnap.data());
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const saveProfile = async (profileData) => {
    try {
      await setDoc(doc(db, 'users', user.uid), profileData);
      setProfile(profileData);
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Failed to save profile');
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setProfile(null);
      setView('login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
        <div className="text-white text-2xl">Loading SmartInvest...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {!user ? (
        view === 'login' ? (
          <LoginView setView={setView} />
        ) : (
          <SignupView setView={setView} />
        )
      ) : (
        <Dashboard 
          user={user} 
          profile={profile} 
          saveProfile={saveProfile}
          handleLogout={handleLogout}
          setView={setView}
        />
      )}
    </div>
  );
}

// Login Component
function LoginView({ setView }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      setError(error.message);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl p-8 w-full max-w-md">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">SmartInvest</h1>
        <p className="text-gray-600 mb-6">AI-Powered Personal Finance</p>
        
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          {error && (
            <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Login
          </button>
        </form>

        <div className="mt-4 text-center">
          <button
            onClick={() => setView('signup')}
            className="text-blue-600 hover:underline text-sm"
          >
            Don't have an account? Sign up
          </button>
        </div>
      </div>
    </div>
  );
}

// Signup Component
function SignupView({ setView }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const handleSignup = async (e) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      await createUserWithEmailAndPassword(auth, email, password);
    } catch (error) {
      setError(error.message);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl p-8 w-full max-w-md">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Create Account</h1>
        <p className="text-gray-600 mb-6">Join SmartInvest today</p>
        
        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
              minLength={6}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confirm Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
              minLength={6}
            />
          </div>

          {error && (
            <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Sign Up
          </button>
        </form>

        <div className="mt-4 text-center">
          <button
            onClick={() => setView('login')}
            className="text-blue-600 hover:underline text-sm"
          >
            Already have an account? Login
          </button>
        </div>
      </div>
    </div>
  );
}

// Dashboard Component
function Dashboard({ user, profile, saveProfile, handleLogout, setView }) {
  const [activeTab, setActiveTab] = useState(profile ? 'overview' : 'profile');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-8">
              <h1 className="text-2xl font-bold text-blue-600">SmartInvest</h1>
              <div className="flex gap-4">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    activeTab === 'overview'
                      ? 'bg-blue-100 text-blue-600'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  Overview
                </button>
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    activeTab === 'profile'
                      ? 'bg-blue-100 text-blue-600'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  Profile
                </button>
                <button
                  onClick={() => setActiveTab('recommendations')}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    activeTab === 'recommendations'
                      ? 'bg-blue-100 text-blue-600'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                  disabled={!profile}
                >
                  Recommendations
                </button>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {activeTab === 'overview' && <OverviewTab profile={profile} />}
        {activeTab === 'profile' && (
          <ProfileTab profile={profile} saveProfile={saveProfile} />
        )}
        {activeTab === 'recommendations' && (
          <RecommendationsTab profile={profile} />
        )}
      </div>
    </div>
  );
}

// Profile Tab Component
function ProfileTab({ profile, saveProfile }) {
  const [formData, setFormData] = useState(profile || {
    income: '',
    savings: '',
    goals: '',
    riskTolerance: 'moderate',
    timeHorizon: '5-10 years'
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    saveProfile(formData);
    alert('Profile saved successfully!');
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-8 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Financial Profile</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Annual Income ($)
          </label>
          <input
            type="number"
            value={formData.income}
            onChange={(e) => setFormData({ ...formData, income: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Current Savings ($)
          </label>
          <input
            type="number"
            value={formData.savings}
            onChange={(e) => setFormData({ ...formData, savings: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Financial Goals
          </label>
          <textarea
            value={formData.goals}
            onChange={(e) => setFormData({ ...formData, goals: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            rows="4"
            placeholder="e.g., Save for retirement, buy a house, build emergency fund"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Risk Tolerance
          </label>
          <select
            value={formData.riskTolerance}
            onChange={(e) => setFormData({ ...formData, riskTolerance: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="conservative">Conservative</option>
            <option value="moderate">Moderate</option>
            <option value="aggressive">Aggressive</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Time Horizon
          </label>
          <select
            value={formData.timeHorizon}
            onChange={(e) => setFormData({ ...formData, timeHorizon: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="1-3 years">1-3 years</option>
            <option value="3-5 years">3-5 years</option>
            <option value="5-10 years">5-10 years</option>
            <option value="10+ years">10+ years</option>
          </select>
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          Save Profile
        </button>
      </form>
    </div>
  );
}

// Overview Tab Component  
function OverviewTab({ profile }) {
  const [stockData, setStockData] = useState([]);
  const [cryptoData, setCryptoData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMarketData();
  }, []);

  const fetchMarketData = async () => {
    try {
      // Fetch popular stocks
      const stocksResponse = await fetch(`${API_BASE_URL}/stocks/batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbols: ['AAPL', 'GOOGL', 'MSFT', 'TSLA'] })
      });
      const stocks = await stocksResponse.json();
      setStockData(stocks.filter(s => s.data));

      // Fetch popular cryptos
      const cryptoResponse = await fetch(`${API_BASE_URL}/crypto/batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: ['bitcoin', 'ethereum', 'cardano'] })
      });
      const crypto = await cryptoResponse.json();
      setCryptoData(crypto.filter(c => c.data));

      setLoading(false);
    } catch (error) {
      console.error('Error fetching market data:', error);
      setLoading(false);
    }
  };

  if (!profile) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
        <h3 className="text-lg font-semibold text-yellow-800 mb-2">
          Complete Your Profile
        </h3>
        <p className="text-yellow-700">
          Please complete your financial profile to get personalized recommendations.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Profile Summary */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Your Financial Overview</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-blue-50 rounded-lg">
            <div className="text-sm text-gray-600">Annual Income</div>
            <div className="text-2xl font-bold text-blue-600">
              ${parseInt(profile.income).toLocaleString()}
            </div>
          </div>
          <div className="p-4 bg-green-50 rounded-lg">
            <div className="text-sm text-gray-600">Savings</div>
            <div className="text-2xl font-bold text-green-600">
              ${parseInt(profile.savings).toLocaleString()}
            </div>
          </div>
          <div className="p-4 bg-purple-50 rounded-lg">
            <div className="text-sm text-gray-600">Risk Level</div>
            <div className="text-2xl font-bold text-purple-600 capitalize">
              {profile.riskTolerance}
            </div>
          </div>
          <div className="p-4 bg-orange-50 rounded-lg">
            <div className="text-sm text-gray-600">Time Horizon</div>
            <div className="text-2xl font-bold text-orange-600">
              {profile.timeHorizon}
            </div>
          </div>
        </div>
      </div>

      {/* Market Data */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Stocks */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Popular Stocks</h3>
          {loading ? (
            <div className="text-center py-4">Loading...</div>
          ) : (
            <div className="space-y-3">
              {stockData.map((stock) => (
                <div key={stock.symbol} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-semibold">{stock.data.symbol}</div>
                    <div className="text-2xl font-bold">${stock.data.price.toFixed(2)}</div>
                  </div>
                  <div className={`text-right ${stock.data.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    <div className="font-semibold">
                      {stock.data.change >= 0 ? '+' : ''}{stock.data.change.toFixed(2)}
                    </div>
                    <div className="text-sm">{stock.data.changePercent}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Crypto */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Popular Cryptocurrencies</h3>
          {loading ? (
            <div className="text-center py-4">Loading...</div>
          ) : (
            <div className="space-y-3">
              {cryptoData.map((crypto) => (
                <div key={crypto.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-semibold capitalize">{crypto.id}</div>
                    <div className="text-2xl font-bold">${crypto.data.price.toLocaleString()}</div>
                  </div>
                  <div className={`text-right ${crypto.data.change24h >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    <div className="font-semibold">
                      {crypto.data.change24h >= 0 ? '+' : ''}{crypto.data.change24h.toFixed(2)}%
                    </div>
                    <div className="text-sm">24h</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Recommendations Tab Component
function RecommendationsTab({ profile }) {
  const [recommendations, setRecommendations] = useState(null);
  const [loading, setLoading] = useState(false);

  const generateRecommendations = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/recommendations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile })
      });
      const data = await response.json();
      setRecommendations(data);
    } catch (error) {
      console.error('Error generating recommendations:', error);
      alert('Failed to generate recommendations');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          AI-Powered Investment Recommendations
        </h2>
        
        {!recommendations ? (
          <div className="text-center py-8">
            <p className="text-gray-600 mb-4">
              Get personalized investment recommendations based on your financial profile.
            </p>
            <button
              onClick={generateRecommendations}
              disabled={loading}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400"
            >
              {loading ? 'Generating...' : 'Generate Recommendations'}
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Asset Allocation */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-3">
                Recommended Asset Allocation
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(recommendations.allocation).map(([key, value]) => (
                  <div key={key} className="p-4 bg-gray-50 rounded-lg text-center">
                    <div className="text-3xl font-bold text-blue-600">{value}%</div>
                    <div className="text-sm text-gray-600 capitalize">{key}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Specific Recommendations */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-3">
                Investment Suggestions
              </h3>
              <div className="space-y-3">
                {recommendations.recommendations.map((rec, idx) => (
                  <div key={idx} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <div className="font-semibold text-gray-800">{rec.category}</div>
                      <div className="text-blue-600 font-bold">{rec.allocation}%</div>
                    </div>
                    <div className="text-gray-600 text-sm">{rec.suggestion}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Strategy */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Strategy</h3>
              <div className="p-4 bg-blue-50 rounded-lg text-gray-700">
                {recommendations.strategy}
              </div>
            </div>

            {/* Risks */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-3">
                Risk Considerations
              </h3>
              <ul className="space-y-2">
                {recommendations.risks.map((risk, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-red-500 mt-1">⚠️</span>
                    <span className="text-gray-700">{risk}</span>
                  </li>
                ))}
              </ul>
            </div>

            <button
              onClick={generateRecommendations}
              disabled={loading}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Regenerate Recommendations
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;