import React, { useEffect, useMemo, useState } from 'react';
import {
  Leaf,
  CloudSun,
  Droplets,
  FlaskConical,
  MessageCircle,
  LogOut,
  Menu,
  Upload,
  Plus,
  LayoutDashboard,
  UserCircle,
  ShieldCheck,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Send,
  X,
  Sprout
} from 'lucide-react';

import { createRoot } from 'react-dom/client';
import './style.css';

const API =
  import.meta.env.VITE_API_URL ||
  'http://localhost:8000/api';

/* =========================================================
   API HELPER
   ========================================================= */

async function api(path, options = {}) {
  const headers = {
    ...(options.headers || {})
  };

  const token = localStorage.getItem('token');

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  if (
    options.body &&
    !(options.body instanceof FormData) &&
    !(options.body instanceof URLSearchParams) &&
    typeof options.body !== 'string'
  ) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(API + path, {
    ...options,
    headers
  });

  const data = await response
    .json()
    .catch(() => null);

  if (!response.ok) {
    let message = 'Request failed';

    if (Array.isArray(data?.detail)) {
      message = data.detail
        .map((item) => {
          if (typeof item === 'string') return item;
          return item?.msg || item?.message || 'Invalid input';
        })
        .join(', ');
    } else if (typeof data?.detail === 'string') {
      message = data.detail;
    } else if (typeof data?.message === 'string') {
      message = data.message;
    }

    if (response.status === 401) {
      localStorage.removeItem('token');
    }

    throw new Error(message);
  }

  return data;
}

/* =========================================================
   REUSABLE FIELD
   ========================================================= */

function Field({ label, ...props }) {
  return (
    <label>
      <small>{label}</small>
      <input {...props} />
    </label>
  );
}

/* =========================================================
   AUTH
   ========================================================= */

function Auth({ setUser }) {
  const [mode, setMode] = useState('login');

  const [form, setForm] = useState({
    email: '',
    password: '',
    full_name: '',
    city: '',
    state: ''
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const updateField = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const submit = async (event) => {
    event.preventDefault();

    setError('');
    setLoading(true);

    try {
      if (mode === 'register') {
        await api('/auth/register', {
          method: 'POST',
          body: JSON.stringify({
            email: form.email.trim(),
            password: form.password,
            full_name: form.full_name.trim(),
            city: form.city.trim(),
            state: form.state.trim()
          })
        });
      }

      const loginBody = new URLSearchParams();

      loginBody.append('username', form.email.trim());
      loginBody.append('password', form.password);

      const loginResponse = await api('/auth/login', {
        method: 'POST',
        body: loginBody,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      if (!loginResponse?.access_token) {
        throw new Error(
          'Login succeeded but no access token was returned.'
        );
      }

      localStorage.setItem(
        'token',
        loginResponse.access_token
      );

      const currentUser = await api('/auth/me');
      setUser(currentUser);
    } catch (err) {
      console.error('Authentication error:', err);
      setError(err?.message || 'Unable to sign in');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth">
      <div className="pitch">
        <Leaf size={45} />

        <h1>
          Smart AI
          <br />
          <i>Farming Assistant</i>
        </h1>

        <p>
          Crop health, weather, fertilizer, irrigation and
          AI farming guidance in one platform.
        </p>

        <div className="auth-features">
          <span>
            <ShieldCheck size={16} />
            AI crop disease detection
          </span>
          <span>
            <CloudSun size={16} />
            Live weather support
          </span>
          <span>
            <Sprout size={16} />
            Smart crop recommendations
          </span>
        </div>
      </div>

      <form className="box" onSubmit={submit}>
        <h2>
          {mode === 'login'
            ? 'Welcome back'
            : 'Create farmer account'}
        </h2>

        {error && (
          <p className="err">
            {error}
          </p>
        )}

        {mode === 'register' && (
          <>
            <Field
              label="Full name"
              value={form.full_name}
              onChange={(e) =>
                updateField('full_name', e.target.value)
              }
              required
            />

            <Field
              label="City"
              value={form.city}
              onChange={(e) =>
                updateField('city', e.target.value)
              }
            />

            <Field
              label="State"
              value={form.state}
              onChange={(e) =>
                updateField('state', e.target.value)
              }
            />
          </>
        )}

        <Field
          label="Email"
          type="email"
          value={form.email}
          onChange={(e) =>
            updateField('email', e.target.value)
          }
          required
        />

        <Field
          label="Password"
          type="password"
          value={form.password}
          onChange={(e) =>
            updateField('password', e.target.value)
          }
          minLength={8}
          required
        />

        <button type="submit" disabled={loading}>
          {loading
            ? 'Please wait...'
            : mode === 'login'
              ? 'Sign in'
              : 'Register'}
        </button>

        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            setError('');
            setMode((prev) =>
              prev === 'login' ? 'register' : 'login'
            );
          }}
        >
          {mode === 'login'
            ? 'Create account'
            : 'Back to login'}
        </a>
      </form>
    </main>
  );
}

/* =========================================================
   APP
   ========================================================= */

function App() {
  const [user, setUser] = useState(null);
  const [tab, setTab] = useState('dashboard');
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');

    if (!token) {
      setCheckingAuth(false);
      return;
    }

    api('/auth/me')
      .then((currentUser) => {
        setUser(currentUser);
      })
      .catch(() => {
        localStorage.removeItem('token');
        setUser(null);
      })
      .finally(() => {
        setCheckingAuth(false);
      });
  }, []);

  if (checkingAuth) {
    return (
      <main
        style={{
          minHeight: '100vh',
          display: 'grid',
          placeItems: 'center'
        }}
      >
        <p>Loading Smart AI Farming Assistant...</p>
      </main>
    );
  }

  if (!user) {
    return <Auth setUser={setUser} />;
  }

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setTab('dashboard');
  };

  const selectTab = (nextTab) => {
    setTab(nextTab);
    setMobileOpen(false);
  };

  const pages = {
    dashboard: <Dashboard />,
    crops: <Crops />,
    disease: <Disease />,
    recommend: <Recommend />,
    weather: <Weather />,
    assistant: <Assistant />,
    profile: (
      <Profile
        user={user}
        setUser={setUser}
      />
    )
  };

  const pageTitleMap = {
    dashboard: 'Dashboard',
    crops: 'Crops',
    disease: 'Disease AI',
    recommend: 'Recommendations',
    weather: 'Weather',
    assistant: 'AI Assistant',
    profile: 'Profile'
  };

  return (
    <div className="app">
      {mobileOpen && (
        <button
          className="sidebar-overlay"
          aria-label="Close menu"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside className={mobileOpen ? 'open' : ''}>
        <div className="logo">
          <Leaf />
          <b>
            Smart AI
            <br />
            Farming
          </b>

          <button
            className="mobile-close"
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        {[
          ['dashboard', 'Dashboard', LayoutDashboard],
          ['crops', 'Crops', Leaf],
          ['disease', 'Disease AI', ShieldCheck],
          ['recommend', 'Recommendations', FlaskConical],
          ['weather', 'Weather', CloudSun],
          ['assistant', 'AI Assistant', MessageCircle],
          ['profile', 'Profile', UserCircle]
        ].map(([id, name, Icon]) => (
          <button
            key={id}
            className={tab === id ? 'sel' : ''}
            onClick={() => selectTab(id)}
          >
            <Icon size={18} />
            {name}
          </button>
        ))}

        <button onClick={logout}>
          <LogOut size={18} />
          Sign out
        </button>
      </aside>

      <section className="content">
        <header>
          <button
            className="menu-button"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <Menu />
          </button>

          <div>
            <small>SMART AGRICULTURE</small>
            <h2>{pageTitleMap[tab]}</h2>
          </div>

          <div className="header-user">
            <span>
              {user?.profile?.full_name ||
                user?.email ||
                'Farmer'}
            </span>
          </div>
        </header>

        {pages[tab]}
      </section>
    </div>
  );
}

/* =========================================================
   DASHBOARD
   ========================================================= */

function Dashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadDashboard = async (silent = false) => {
    if (silent) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const data = await api('/dashboard');
      setDashboard(data);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  return (
    <Page
      title="Farm overview"
      action={
        <button
          className="secondary-button"
          onClick={() => loadDashboard(true)}
          disabled={refreshing}
          title="Refresh dashboard"
        >
          <RefreshCw
            size={17}
            className={refreshing ? 'spin' : ''}
          />
          Refresh
        </button>
      }
    >
      {error && <p className="err">{error}</p>}

      {loading && <p>Loading dashboard...</p>}

      {dashboard && (
        <>
          <div className="stats">
            <Stat
              n={dashboard.active_crops ?? 0}
              t="Active crops"
              I={Leaf}
            />

            <Stat
              n={dashboard.total_crops ?? 0}
              t="Crop records"
              I={LayoutDashboard}
            />

            <Stat
              n={dashboard.diagnoses ?? 0}
              t="AI diagnoses"
              I={ShieldCheck}
            />
          </div>

          <Card>
            <div className="card-heading">
              <div>
                <h3>Recent crops</h3>
                <small>Your latest crop records</small>
              </div>

              <Sprout size={22} />
            </div>

            {dashboard.recent_crops?.length > 0 ? (
              dashboard.recent_crops.map((crop) => (
                <p className="row" key={crop.id}>
                  <Leaf size={18} />

                  <b>{crop.crop_type}</b>

                  <span>
                    {crop.area_acres} acres ·{' '}
                    {crop.growth_stage}
                  </span>
                </p>
              ))
            ) : (
              <EmptyState
                icon={Leaf}
                title="No crop records yet"
                text="Add your first crop from the Crops section."
              />
            )}
          </Card>
        </>
      )}
    </Page>
  );
}

/* =========================================================
   COMMON COMPONENTS
   ========================================================= */

function Stat({ n, t, I }) {
  return (
    <div className="stat">
      <I />
      <b>{n}</b>
      <span>{t}</span>
    </div>
  );
}

function Card({ children, className = '' }) {
  return (
    <div className={`card ${className}`}>
      {children}
    </div>
  );
}

function Page({ title, children, action }) {
  return (
    <main className="page">
      <div className="page-title-row">
        <h1>{title}</h1>
        {action}
      </div>
      {children}
    </main>
  );
}

function EmptyState({
  icon: Icon,
  title,
  text
}) {
  return (
    <div className="empty-state">
      <Icon size={30} />
      <b>{title}</b>
      <span>{text}</span>
    </div>
  );
}

/* =========================================================
   CROPS
   ========================================================= */

function Crops() {
  const [crops, setCrops] = useState([]);
  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState({
    crop_type: '',
    area_acres: 1,
    growth_stage: 'vegetative'
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const loadCrops = async () => {
    try {
      const data = await api('/crops');
      setCrops(Array.isArray(data) ? data : []);
      setError('');
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    loadCrops();
  }, []);

  const saveCrop = async (event) => {
    event.preventDefault();

    setError('');

    if (!form.crop_type.trim()) {
      setError('Please enter a crop name.');
      return;
    }

    const area = Number(form.area_acres);

    if (!Number.isFinite(area) || area <= 0) {
      setError('Area must be greater than 0.');
      return;
    }

    setLoading(true);

    try {
      await api('/crops', {
        method: 'POST',
        body: JSON.stringify({
          crop_type: form.crop_type.trim(),
          area_acres: area,
          growth_stage: form.growth_stage.trim()
        })
      });

      setShowForm(false);

      setForm({
        crop_type: '',
        area_acres: 1,
        growth_stage: 'vegetative'
      });

      await loadCrops();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Page
      title="Crop management"
      action={
        <button onClick={() => setShowForm((v) => !v)}>
          <Plus size={18} />
          {showForm ? 'Close' : 'Add crop'}
        </button>
      }
    >
      {error && <p className="err">{error}</p>}

      {showForm && (
        <Card>
          <form onSubmit={saveCrop}>
            <Field
              label="Crop"
              value={form.crop_type}
              onChange={(e) =>
                setForm({
                  ...form,
                  crop_type: e.target.value
                })
              }
              placeholder="e.g. Wheat"
              required
            />

            <Field
              label="Area acres"
              type="number"
              min="0.01"
              step="0.01"
              value={form.area_acres}
              onChange={(e) =>
                setForm({
                  ...form,
                  area_acres: e.target.value
                })
              }
              required
            />

            <Field
              label="Growth stage"
              value={form.growth_stage}
              onChange={(e) =>
                setForm({
                  ...form,
                  growth_stage: e.target.value
                })
              }
              placeholder="e.g. vegetative"
              required
            />

            <button type="submit" disabled={loading}>
              {loading ? 'Saving...' : 'Save crop'}
            </button>
          </form>
        </Card>
      )}

      <div className="grid">
        {crops.length > 0 ? (
          crops.map((crop) => (
            <Card key={crop.id}>
              <div className="crop-icon">
                <Leaf />
              </div>

              <h3>{crop.crop_type}</h3>

              <p>
                {crop.area_acres} acres ·{' '}
                {crop.growth_stage}
              </p>

              <small>
                {crop.notes || 'No notes'}
              </small>
            </Card>
          ))
        ) : (
          <Card>
            <EmptyState
              icon={Leaf}
              title="No crops added yet"
              text="Create a crop record to unlock recommendations."
            />
          </Card>
        )}
      </div>
    </Page>
  );
}

/* =========================================================
   DISEASE AI
   ========================================================= */

function Disease() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!file) {
      setPreview('');
      return;
    }

    const url = URL.createObjectURL(file);
    setPreview(url);

    return () => URL.revokeObjectURL(url);
  }, [file]);

  const analyze = async (event) => {
    event.preventDefault();

    if (!file) {
      setError('Please select an image first.');
      return;
    }

    setBusy(true);
    setError('');
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await api('/diagnosis', {
        method: 'POST',
        body: formData
      });

      setResult(response);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const confidence = result
    ? Number(result.confidence || 0) * 100
    : 0;

  return (
    <Page title="AI disease detection">
      <Card>
        <form onSubmit={analyze}>
          <label className="upload">
            <Upload size={35} />

            <b>
              {file?.name ||
                'Choose crop leaf image'}
            </b>

            <small>
              JPG, JPEG or PNG
            </small>

            <input
              type="file"
              accept="image/jpeg,image/png"
              onChange={(e) => {
                const selected =
                  e.target.files?.[0] || null;

                setFile(selected);
                setResult(null);
                setError('');
              }}
            />
          </label>

          {preview && (
            <div className="image-preview">
              <img
                src={preview}
                alt="Selected crop leaf"
              />
            </div>
          )}

          {error && (
            <p className="err">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={!file || busy}
          >
            {busy ? 'Analyzing...' : 'Analyze image'}
          </button>
        </form>

        {result && (
          <div className="result">
            {String(result.status || '').toLowerCase() ===
            'healthy' ? (
              <CheckCircle2 />
            ) : (
              <AlertTriangle />
            )}

            <h2>{result.predicted_class}</h2>

            <p>
              Status: {result.status}
              {' · '}
              Confidence: {confidence.toFixed(1)}%
            </p>

            <p>
              {result.recommendation}
            </p>
          </div>
        )}
      </Card>

      <Card>
        <div className="card-heading">
          <div>
            <h3>Better diagnosis tips</h3>
            <small>
              Image quality directly affects AI prediction quality.
            </small>
          </div>
          <ShieldCheck size={22} />
        </div>

        <ul>
          <li>Use a clear, focused leaf image.</li>
          <li>Avoid very dark or blurry photos.</li>
          <li>Keep the leaf mostly visible in the frame.</li>
          <li>Use the prediction as guidance, not a substitute for an agricultural expert.</li>
        </ul>
      </Card>
    </Page>
  );
}

/* =========================================================
   RECOMMENDATIONS
   ========================================================= */

function Recommend() {
  const [crops, setCrops] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [fertilizer, setFertilizer] = useState(null);
  const [irrigation, setIrrigation] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api('/crops')
      .then((data) => {
        setCrops(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        setError(err.message);
      });
  }, []);

  const selectedCrop = useMemo(
    () =>
      crops.find(
        (item) =>
          String(item.id) === String(selectedId)
      ),
    [crops, selectedId]
  );

  const generate = async () => {
    if (!selectedCrop) {
      setError('Please select a crop first.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const common = {
        crop_type: selectedCrop.crop_type,
        growth_stage: selectedCrop.growth_stage,
        area_acres: Number(selectedCrop.area_acres),
        soil_moisture: selectedCrop.soil_moisture
      };

      const [fertilizerResponse, irrigationResponse] =
        await Promise.all([
          api('/recommendations/fertilizer', {
            method: 'POST',
            body: JSON.stringify(common)
          }),
          api('/recommendations/irrigation', {
            method: 'POST',
            body: JSON.stringify(common)
          })
        ]);

      setFertilizer(fertilizerResponse);
      setIrrigation(irrigationResponse);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Page title="Recommendations">
      {error && <p className="err">{error}</p>}

      <Card>
        <div className="card-heading">
          <div>
            <h3>Smart farm recommendations</h3>
            <small>
              Select a crop to generate fertilizer and irrigation guidance.
            </small>
          </div>
          <FlaskConical size={22} />
        </div>

        <select
          value={selectedId}
          onChange={(e) => {
            setSelectedId(e.target.value);
            setFertilizer(null);
            setIrrigation(null);
            setError('');
          }}
        >
          <option value="">
            Select crop
          </option>

          {crops.map((crop) => (
            <option
              key={crop.id}
              value={crop.id}
            >
              {crop.crop_type} · {crop.area_acres} acres
            </option>
          ))}
        </select>

        <button
          onClick={generate}
          disabled={loading || !selectedId}
        >
          {loading
            ? 'Generating...'
            : 'Generate recommendations'}
        </button>
      </Card>

      <div className="grid">
        <Rec
          d={fertilizer}
          I={FlaskConical}
        />

        <Rec
          d={irrigation}
          I={Droplets}
        />
      </div>
    </Page>
  );
}

function Rec({ d, I }) {
  return (
    <Card>
      <I />

      {d ? (
        <>
          <h3>{d.title}</h3>

          {d.priority && (
            <b>{d.priority}</b>
          )}

          <p>{d.recommendation}</p>

          {Array.isArray(d.rationale) &&
            d.rationale.length > 0 && (
              <ul>
                {d.rationale.map(
                  (item, index) => (
                    <li key={index}>
                      {item}
                    </li>
                  )
                )}
              </ul>
            )}
        </>
      ) : (
        <p>
          Select a crop to generate recommendations.
        </p>
      )}
    </Card>
  );
}

/* =========================================================
   WEATHER
   ========================================================= */

function Weather() {
  const [city, setCity] = useState('');
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const getWeather = async () => {
    const cleanCity = city.trim();

    if (!cleanCity) {
      setError('Please enter a city.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const response = await api(
        '/weather?city=' +
          encodeURIComponent(cleanCity)
      );

      setData(response);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Page title="Weather forecast">
      <Card>
        <Field
          label="City"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder="e.g. Ghaziabad"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              getWeather();
            }
          }}
        />

        <button
          onClick={getWeather}
          disabled={loading}
        >
          {loading ? 'Loading...' : 'Get forecast'}
        </button>

        {error && (
          <p className="err">
            {error}
          </p>
        )}
      </Card>

      {data && (
        <>
          {data.city && (
            <Card>
              <div className="card-heading">
                <div>
                  <h3>{data.city}</h3>

                  {data.country && (
                    <small>{data.country}</small>
                  )}
                </div>

                <CloudSun size={28} />
              </div>
            </Card>
          )}

          <div className="grid">
            {Array.isArray(data.forecast) &&
              data.forecast.map(
                (item, index) => (
                  <Card key={index}>
                    <CloudSun />

                    <b>
                      {item.time
                        ? new Date(
                            item.time.replace(
                              ' ',
                              'T'
                            )
                          ).toLocaleString()
                        : 'Forecast'}
                    </b>

                    <h2>
                      {Math.round(
                        Number(
                          item.temperature_c || 0
                        )
                      )}
                      °C
                    </h2>

                    <p>
                      {item.description}
                    </p>

                    <small>
                      Humidity {item.humidity_pct}% · Rain{' '}
                      {item.rain_mm_3h} mm
                    </small>
                  </Card>
                )
              )}
          </div>
        </>
      )}
    </Page>
  );
}

/* =========================================================
   AI ASSISTANT
   ========================================================= */

function Assistant() {
  const [messages, setMessages] = useState([]);
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);

  const sendMessage = async (event) => {
    event.preventDefault();

    const text = question.trim();

    if (!text || loading) {
      return;
    }

    setQuestion('');
    setLoading(true);

    setMessages((prev) => [
      ...prev,
      {
        role: 'user',
        text
      }
    ]);

    try {
      const response = await api('/chat', {
        method: 'POST',
        body: JSON.stringify({
          message: text
        })
      });

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text:
            response.response ||
            'No response received.'
        }
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text:
            'Sorry, I could not process your question: ' +
            err.message
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const quickQuestions = [
    'How often should I irrigate my crop?',
    'How can I improve soil fertility?',
    'What should I check for leaf disease?'
  ];

  return (
    <Page title="AI farming assistant">
      <Card className="chat">
        <div className="assistant-intro">
          <div className="assistant-avatar">
            <MessageCircle size={22} />
          </div>

          <div>
            <h3>Ask your farming assistant</h3>
            <small>
              Get practical guidance about crops,
              fertilizer, irrigation and weather.
            </small>
          </div>
        </div>

        {messages.length === 0 && (
          <>
            <p>
              Start with a question or choose one of
              the suggestions below.
            </p>

            <div className="quick-questions">
              {quickQuestions.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() =>
                    setQuestion(item)
                  }
                >
                  {item}
                </button>
              ))}
            </div>
          </>
        )}

        <div className="message-list">
          {messages.map(
            (message, index) => (
              <div
                key={index}
                className={`message ${message.role}`}
              >
                <small>
                  {message.role === 'user'
                    ? 'You'
                    : 'AI Assistant'}
                </small>

                <p>{message.text}</p>
              </div>
            )
          )}
        </div>

        <form onSubmit={sendMessage}>
          <input
            value={question}
            onChange={(e) =>
              setQuestion(e.target.value)
            }
            placeholder="Ask a farming question..."
            disabled={loading}
          />

          <button
            type="submit"
            disabled={
              loading ||
              !question.trim()
            }
            title="Send"
          >
            {loading ? (
              <RefreshCw
                size={18}
                className="spin"
              />
            ) : (
              <Send size={18} />
            )}
          </button>
        </form>
      </Card>
    </Page>
  );
}

/* =========================================================
   PROFILE
   ========================================================= */

function Profile({ user, setUser }) {
  const [form, setForm] = useState(
    user?.profile || {}
  );

  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm(user?.profile || {});
  }, [user]);

  const updateField = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value
    }));

    setSaved(false);
  };

  const saveProfile = async (event) => {
    event.preventDefault();

    setError('');
    setSaved(false);
    setSaving(true);

    try {
      const profile = await api('/profile', {
        method: 'PUT',
        body: JSON.stringify({
          ...form,
          farm_size_acres:
            form.farm_size_acres === ''
              ? null
              : form.farm_size_acres == null
                ? null
                : Number(form.farm_size_acres)
        })
      });

      setUser({
        ...user,
        profile
      });

      setForm(profile);
      setSaved(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Page title="Farmer profile">
      <Card>
        {error && (
          <p className="err">
            {error}
          </p>
        )}

        {saved && (
          <p className="success">
            <CheckCircle2 size={17} />
            Profile saved successfully.
          </p>
        )}

        <form onSubmit={saveProfile}>
          <Field
            label="Full name"
            value={form.full_name || ''}
            onChange={(e) =>
              updateField(
                'full_name',
                e.target.value
              )
            }
          />

          <Field
            label="City"
            value={form.city || ''}
            onChange={(e) =>
              updateField(
                'city',
                e.target.value
              )
            }
          />

          <Field
            label="State"
            value={form.state || ''}
            onChange={(e) =>
              updateField(
                'state',
                e.target.value
              )
            }
          />

          <Field
            label="Farm size acres"
            type="number"
            min="0"
            step="0.01"
            value={form.farm_size_acres ?? ''}
            onChange={(e) =>
              updateField(
                'farm_size_acres',
                e.target.value
              )
            }
          />

          <Field
            label="Soil type"
            value={form.soil_type || ''}
            onChange={(e) =>
              updateField(
                'soil_type',
                e.target.value
              )
            }
            placeholder="e.g. loamy"
          />

          <button
            type="submit"
            disabled={saving}
          >
            {saving
              ? 'Saving...'
              : 'Save profile'}
          </button>
        </form>
      </Card>
    </Page>
  );
}

/* =========================================================
   START APPLICATION
   ========================================================= */

createRoot(
  document.getElementById('root')
).render(<App />);
