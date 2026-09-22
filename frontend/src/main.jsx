import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import "./style.css";
import farmBg from "./farm-bg copy.jpg";

const API = "https://smart-ai-farming-backend.onrender.com/api";

async function api(path, options = {}) {
  const headers = { ...(options.headers || {}) };
  const token = localStorage.getItem("token");

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  if (
    options.body &&
    !(options.body instanceof FormData) &&
    !(options.body instanceof URLSearchParams) &&
    typeof options.body === "string" &&
    !headers["Content-Type"]
  ) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(API + path, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    let message = "Request failed";

    if (Array.isArray(data?.detail)) {
      message = data.detail
        .map((item) => item?.msg || "Invalid input")
        .join(", ");
    } else if (typeof data?.detail === "string") {
      message = data.detail;
    } else if (typeof data?.message === "string") {
      message = data.message;
    }

    throw new Error(message);
  }

  return data;
}

const navItems = [
  ["dashboard", "🏠", "Dashboard"],
  ["crops", "🌱", "Crops"],
  ["disease", "🩺", "Disease AI"],
  ["recommendations", "🧪", "Recommendations"],
  ["weather", "🌦️", "Weather"],
  ["assistant", "🤖", "AI Assistant"],
  ["profile", "👤", "Profile"],
];

function App() {
  const [page, setPage] = useState("dashboard");
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authMode, setAuthMode] = useState("login");

  async function loadUser() {
    try {
      const me = await api("/auth/me");
      setUser(me);
    } catch {
      localStorage.removeItem("token");
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUser();
  }, []);

  function logout() {
    localStorage.removeItem("token");
    setUser(null);
  }

  if (loading) {
    return (
      <div className="center-screen">
        <div className="center-card">
          <div className="loader"></div>
          <p>Loading Smart AI Farming Assistant...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <AuthScreen
        mode={authMode}
        setMode={setAuthMode}
        onLogin={(data) => {
          localStorage.setItem("token", data.access_token);
          loadUser();
        }}
        onRegister={(data) => {
          localStorage.setItem("token", data.access_token);
          loadUser();
        }}
      />
    );
  }

  return (
    <div className="professional-app">

      <header className="professional-header">
        <div className="professional-logo">
          <div className="professional-logo-icon">🌿</div>
          <div>
            <strong>Smart AI Farming</strong>
            <span>Assistant</span>
          </div>
        </div>

        <nav className="professional-nav">
          <button onClick={() => setPage("dashboard")}>Dashboard</button>
          <button onClick={() => setPage("crops")}>My Crops</button>
          <button onClick={() => setPage("disease")}>Disease AI</button>
          <button onClick={() => setPage("recommendations")}>Recommendations</button>
          <button onClick={() => setPage("weather")}>Weather</button>
        </nav>

        <div className="professional-right">
          <input placeholder="Search crops, diseases..." />
          <span className="bell">🔔</span>
          
          
        </div>
      </header>

      <div className="professional-layout">

        <aside className="professional-sidebar">
          <div className="farm-menu">FARM MENU</div>

          {navItems.map(([id, icon, label]) => (
            <button
              key={id}
              className={page === id ? "professional-side active" : "professional-side"}
              onClick={() => setPage(id)}
            >
              <span>{icon}</span>
              {label}
            </button>
          ))}

          <button className="professional-side signout-final" onClick={logout}>
            <span>↪️</span>
            Sign out
          </button>
        </aside>

        <main className="professional-main">
          {page === "dashboard" && (
            <DashboardHome setPage={setPage} user={user} />
          )}

          {page === "crops" && <Crops />}
          {page === "disease" && <DiseaseAI />}
          {page === "recommendations" && <Recommendations />}
          {page === "weather" && <Weather user={user} />}
          {page === "assistant" && <Assistant />}
          {page === "profile" && <Profile user={user} onSaved={loadUser} />}
        </main>
      </div>
    </div>
  );
}

function DashboardHome({ setPage, user }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    api("/dashboard")
      .then(setData)
      .catch(() => setData({}));
  }, []);

  const active = data?.active_crops ?? data?.crops_count ?? 0;
  const records = data?.crop_records ?? data?.history_count ?? 0;
  const diagnoses = data?.ai_diagnoses ?? data?.diagnoses_count ?? 0;

  return (
    <div className="REAL-DASHBOARD">

     <section
  className="REAL-HERO"
  style={{
    backgroundImage: `linear-gradient(
      90deg,
      rgba(2,59,42,.90),
      rgba(4,75,53,.55),
      rgba(4,75,53,.12)
    ), url(${farmBg})`,
    backgroundSize: "cover",
    backgroundPosition: "center"
  }}
>
        <div className="REAL-HERO-CONTENT">
       
          <h1>Welcome back, {user?.full_name || "Farmer"}! 👋</h1>
          
         
          <br />
          <button onClick={() => setPage("disease")}>
            Check Crop Health →
          </button>
        </div>
      </section>

      <section className="REAL-STATS">
        <div className="REAL-STAT">
          <span>🌱</span>
          <div><b>{active}</b><small>Active Crops</small></div>
        </div>

        <div className="REAL-STAT">
          <span>📋</span>
          <div><b>{records}</b><small>Crop Records</small></div>
        </div>

        <div className="REAL-STAT">
          <span>🩺</span>
          <div><b>{diagnoses}</b><small>AI Diagnoses</small></div>
        </div>

        <div className="REAL-STAT">
          <span>🌦️</span>
          <div><b><LiveWeather /></b><small>Current Weather</small></div>
        </div>
      </section>

      <section className="REAL-GRID">

        <div className="REAL-CARD">
          <div className="REAL-SECTION-HEAD">
            <div>
              <h2>Quick Actions</h2>
              <p>Get started with the tools you need.</p>
            </div>
            <button onClick={() => setPage("crops")}>View All →</button>
          </div>

          <div className="REAL-ACTIONS">

            <button onClick={() => setPage("crops")}>
              <span>🌱</span>
              <div>
                <b>Add a Crop</b>
                <small>Create a crop record and track its growth.</small>
              </div>
              <strong>→</strong>
            </button>

            <button onClick={() => setPage("disease")}>
              <span>📷</span>
              <div>
                <b>Detect Disease</b>
                <small>Upload a leaf image for AI analysis.</small>
              </div>
              <strong>→</strong>
            </button>

            <button onClick={() => setPage("recommendations")}>
              <span>🧪</span>
              <div>
                <b>Get Recommendations</b>
                <small>Find treatment and farming tips.</small>
              </div>
              <strong>→</strong>
            </button>

            <button onClick={() => setPage("weather")}>
              <span>☁️</span>
              <div>
                <b>Check Weather</b>
                <small>View current weather for your area.</small>
              </div>
              <strong>→</strong>
            </button>

          </div>

          <div className="REAL-TIP">
            <span>🌿</span>
            <div>
              <b>Did you know?</b>
              <small>Early disease detection can help farmers protect crop health.</small>
            </div>
            <button onClick={() => setPage("disease")}>Learn More</button>
          </div>
        </div>

        <div>

          <div className="REAL-CARD REAL-ACTIVITY">
            <div className="REAL-SECTION-HEAD">
              <h2>Recent Activity</h2>
              <button>View All →</button>
            </div>

            <div className="REAL-EMPTY">
              <span>📋</span>
              <b>No recent activity</b>
              <small>Start by adding a crop or analyzing a plant disease.</small>
            </div>
          </div>

          <div className="REAL-CARD">
            <div className="REAL-SECTION-HEAD">
              <h2>Supported Crops</h2>
              <button onClick={() => setPage("crops")}>View All →</button>
            </div>

            <div className="REAL-CROPS">
              <div>🍅<b>Tomato</b></div>
              <div>🥔<b>Potato</b></div>
              <div>🫑<b>Pepper</b></div>
              <div>🍎<b>Apple</b></div>
              <div>🍇<b>Grape</b></div>
              <div>🍊<b>Orange</b></div>
            </div>
          </div>

        </div>
      </section>

      <footer className="REAL-FOOTER">
        <div>
          <h2>🌿 Smart AI Farming Assistant</h2>
          <p>Technology for healthier crops and smarter farming.</p>
        </div>

        <div>
          <b>Quick Links</b>
          <span onClick={() => setPage("dashboard")}>Dashboard</span>
          <span onClick={() => setPage("crops")}>My Crops</span>
        </div>

        <div>
          <b>AI Tools</b>
          <span onClick={() => setPage("disease")}>Disease AI</span>
          <span onClick={() => setPage("recommendations")}>Recommendations</span>
        </div>

        <div>
          <b>Support</b>
          <span onClick={() => setPage("weather")}>Weather</span>
          <span onClick={() => setPage("assistant")}>AI Assistant</span>
        </div>
      </footer>

    </div>
  );
}

/* ================= AUTH ================= */

function AuthScreen({
  mode,
  setMode,
  onLogin,
  onRegister,
}) {
  const [form, setForm] = useState({
    email: "",
    password: "",
    full_name: "",
    phone: "",
    city: "",
    state: "",
    farm_size_acres: "",
    soil_type: "",
  });

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  function change(e) {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  }

  async function submit(e) {
    e.preventDefault();

    setBusy(true);
    setError("");

    try {
      if (mode === "register") {
        const payload = {
          ...form,
          farm_size_acres:
            form.farm_size_acres === ""
              ? null
              : Number(form.farm_size_acres),
        };

        const data = await api("/auth/register", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        onRegister(data);
      } else {
        const body = new URLSearchParams();

        body.set("username", form.email);
        body.set("password", form.password);

        const data = await api("/auth/login", {
          method: "POST",
          headers: {
            "Content-Type":
              "application/x-www-form-urlencoded",
          },
          body,
        });

        onLogin(data);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-art">
        <div className="auth-art-inner">
          <div className="big-leaf">🌿</div>

          <h1>Smart AI Farming Assistant</h1>

          <p>
            AI-powered crop health, recommendations,
            irrigation and weather support for smarter
            farming.
          </p>

          <div className="feature-pills">
            <span>🩺 Disease AI</span>
            <span>🧪 Fertilizer</span>
            <span>💧 Irrigation</span>
            <span>🌦️ Weather</span>
          </div>
        </div>
      </div>

      <div className="auth-card-wrap">
        <form
          className="auth-card"
          onSubmit={submit}
        >
          <div className="auth-logo">🌾</div>

          <h2>
            {mode === "login"
              ? "Welcome back"
              : "Create your account"}
          </h2>

          <p className="muted">
            {mode === "login"
              ? "Sign in to your farming dashboard."
              : "Set up your farmer profile to get personalized guidance."}
          </p>

          {error && (
            <div className="alert error">
              {error}
            </div>
          )}

          {mode === "register" && (
            <>
              <label>
                Full name
                <input
                  name="full_name"
                  value={form.full_name}
                  onChange={change}
                  required
                  minLength={2}
                />
              </label>

              <label>
                Phone
                <input
                  name="phone"
                  value={form.phone}
                  onChange={change}
                />
              </label>

              <div className="grid-2">
                <label>
                  City
                  <input
                    name="city"
                    value={form.city}
                    onChange={change}
                  />
                </label>

                <label>
                  State
                  <input
                    name="state"
                    value={form.state}
                    onChange={change}
                  />
                </label>
              </div>

              <div className="grid-2">
                <label>
                  Farm size (acres)
                  <input
                    name="farm_size_acres"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.farm_size_acres}
                    onChange={change}
                  />
                </label>

                <label>
                  Soil type
                  <input
                    name="soil_type"
                    placeholder="Loamy"
                    value={form.soil_type}
                    onChange={change}
                  />
                </label>
              </div>
            </>
          )}

          <label>
            Email
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={change}
              required
            />
          </label>

          <label>
            Password
            <input
              name="password"
              type="password"
              value={form.password}
              onChange={change}
              required
              minLength={8}
            />
          </label>

          <button
            className="primary wide"
            disabled={busy}
          >
            {busy
              ? "Please wait..."
              : mode === "login"
              ? "Sign in"
              : "Create account"}
          </button>

          <p className="switch-auth">
            {mode === "login"
              ? "New farmer?"
              : "Already have an account?"}{" "}
            <button
              type="button"
              onClick={() => {
                setMode(
                  mode === "login"
                    ? "register"
                    : "login"
                );
                setError("");
              }}
            >
              {mode === "login"
                ? "Create account"
                : "Sign in"}
            </button>
          </p>
        </form>
      </div>
    </div>
  );
}

/* ================= DASHBOARD ================= */


function Dashboard({ setPage }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api("/dashboard")
      .then(setData)
      .catch(e => setError(e.message));
  }, []);

  if (error) return <div className="alert error">{error}</div>;
  if (!data) return <LoadingCard />;

  const active = data.active_crops ?? data.crops_count ?? 0;
  const records = data.crop_records ?? data.history_count ?? 0;
  const diagnoses = data.ai_diagnoses ?? data.diagnoses_count ?? 0;

  const go = p => setPage(p);

  return (
    <div className="real-dashboard">

      <section className="real-hero">
        <div className="real-hero-overlay">
          <div className="real-hero-content">
            <div className="real-eyebrow">SMART AI FARMING ASSISTANT</div>
            <h1>Welcome back, Farmer! 👋</h1>
            <p>Let's make your farm healthier and more productive.</p>
            <em>“Healthy Crops, Prosperous Farmers, Greener Tomorrow”</em>
            <button className="real-hero-btn" onClick={() => go("disease")}>
              Check Crop Health →
            </button>
          </div>
        </div>
      </section>

      <section className="real-container">

        <div className="real-stats">
          <div className="real-stat">
            <div className="real-stat-icon">🌱</div>
            <div><b>{active}</b><span>Active Crops</span></div>
          </div>

          <div className="real-stat">
            <div className="real-stat-icon">📋</div>
            <div><b>{records}</b><span>Crop Records</span></div>
          </div>

          <div className="real-stat">
            <div className="real-stat-icon">🩺</div>
            <div><b>{diagnoses}</b><span>AI Diagnoses</span></div>
          </div>

          <div className="real-stat">
            <div className="real-stat-icon">🌦️</div>
            <div><b><LiveWeather /></b><span>Current Weather</span></div>
          </div>
        </div>

        <div className="real-columns">

          <div className="real-card real-quick">
            <div className="real-card-head">
              <div>
                <h2>Quick Actions</h2>
                <p>Get started with the tools you need.</p>
              </div>
              <button onClick={() => go("crops")}>View All →</button>
            </div>

            <div className="real-actions">

              <button onClick={() => go("crops")} className="real-action">
                <span>🌱</span>
                <div><b>Add a Crop</b><small>Create a crop record and track its growth.</small></div>
                <strong>→</strong>
              </button>

              <button onClick={() => go("disease")} className="real-action">
                <span>📷</span>
                <div><b>Detect Disease</b><small>Upload a leaf image for AI analysis.</small></div>
                <strong>→</strong>
              </button>

              <button onClick={() => go("recommendations")} className="real-action">
                <span>🧪</span>
                <div><b>Get Recommendations</b><small>Find treatment and farming tips.</small></div>
                <strong>→</strong>
              </button>

              <button onClick={() => go("weather")} className="real-action">
                <span>☁️</span>
                <div><b>Check Weather</b><small>View current weather for your area.</small></div>
                <strong>→</strong>
              </button>

            </div>

            <div className="real-tip">
              <span>🌿</span>
              <div>
                <b>Did you know?</b>
                <small>Early disease detection can help farmers protect crop health.</small>
              </div>
              <button onClick={() => go("disease")}>Learn More</button>
            </div>
          </div>

          <div className="real-right">

            <div className="real-card">
              <div className="real-card-head">
                <h2>Recent Activity</h2>
                <button onClick={() => go("disease")}>View All →</button>
              </div>

              <div className="real-empty">
                <span>📋</span>
                <b>No recent activity</b>
                <p>Start by adding a crop or analyzing a plant disease.</p>
              </div>
            </div>

            <div className="real-card">
              <div className="real-card-head">
                <h2>Supported Crops</h2>
                <button onClick={() => go("crops")}>View All →</button>
              </div>

              <div className="real-crops">
                <div><span>🍅</span><b>Tomato</b></div>
                <div><span>🥔</span><b>Potato</b></div>
                <div><span>🫑</span><b>Pepper</b></div>
                <div><span>🍇</span><b>Grape</b></div>
                <div><span>🍎</span><b>Apple</b></div>
                <div><span>🍊</span><b>Orange</b></div>
              </div>
            </div>

          </div>
        </div>
      </section>

      <footer className="real-footer">
        <div>
          <h3>🌿 Smart AI Farming Assistant</h3>
          <p>Smart technology for healthier crops and better farming decisions.</p>
        </div>
        <div>
          <b>Quick Links</b>
          <button onClick={() => go("dashboard")}>Dashboard</button>
          <button onClick={() => go("crops")}>My Crops</button>
          <button onClick={() => go("disease")}>Disease AI</button>
        </div>
        <div>
          <b>Services</b>
          <button onClick={() => go("recommendations")}>Recommendations</button>
          <button onClick={() => go("weather")}>Weather</button>
          <button onClick={() => go("assistant")}>AI Assistant</button>
        </div>
      </footer>

    </div>
  );
}


function Crops() {
  const empty = {
    crop_type: "",
    variety: "",
    area_acres: "",
    sowing_date: "",
    growth_stage: "vegetative",
    soil_type: "",
    nitrogen: "",
    phosphorus: "",
    potassium: "",
    soil_moisture: "",
    notes: "",
  };

  const [crops, setCrops] = useState([]);
  const [form, setForm] = useState(empty);
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    try {
      setCrops(await api("/crops"));
    } catch (e) {
      setError(e.message);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function change(e) {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  }

  async function submit(e) {
    e.preventDefault();

    setBusy(true);
    setError("");

    try {
      const payload = {
        ...form,
        area_acres: Number(form.area_acres),
      };

      [
        "nitrogen",
        "phosphorus",
        "potassium",
        "soil_moisture",
      ].forEach((k) => {
        payload[k] =
          form[k] === ""
            ? null
            : Number(form[k]);
      });

      if (!payload.sowing_date) {
        payload.sowing_date = null;
      }

      await api("/crops", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      setForm(empty);
      setShow(false);

      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function remove(id) {
    if (
      !window.confirm(
        "Delete this crop record?"
      )
    ) {
      return;
    }

    try {
      await api(`/crops/${id}`, {
        method: "DELETE",
      });

      await load();
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <>
      <div className="page-toolbar">
        <div>
          <h2>Crop Management</h2>

          <p className="muted">
            Maintain crop records for personalized
            recommendations.
          </p>
        </div>

        <button
          className="primary"
          onClick={() => setShow(!show)}
        >
          ＋ Add crop
        </button>
      </div>

      {error && (
        <div className="alert error">
          {error}
        </div>
      )}

      {show && (
        <form
          className="form-card"
          onSubmit={submit}
        >
          <h3>New crop</h3>

          <div className="grid-2">
            <label>
              Crop type *
              <input
                name="crop_type"
                value={form.crop_type}
                onChange={change}
                required
              />
            </label>

            <label>
              Variety
              <input
                name="variety"
                value={form.variety}
                onChange={change}
              />
            </label>

            <label>
              Area (acres) *
              <input
                name="area_acres"
                type="number"
                min="0.01"
                step="0.01"
                value={form.area_acres}
                onChange={change}
                required
              />
            </label>

            <label>
              Sowing date
              <input
                name="sowing_date"
                type="date"
                value={form.sowing_date}
                onChange={change}
              />
            </label>

            <label>
              Growth stage
              <select
                name="growth_stage"
                value={form.growth_stage}
                onChange={change}
              >
                <option>seedling</option>
                <option>vegetative</option>
                <option>flowering</option>
                <option>fruiting</option>
                <option>maturity</option>
              </select>
            </label>

            <label>
              Soil type
              <input
                name="soil_type"
                value={form.soil_type}
                onChange={change}
                placeholder="Loamy"
              />
            </label>

            <label>
              Nitrogen (N)
              <input
                name="nitrogen"
                type="number"
                value={form.nitrogen}
                onChange={change}
              />
            </label>

            <label>
              Phosphorus (P)
              <input
                name="phosphorus"
                type="number"
                value={form.phosphorus}
                onChange={change}
              />
            </label>

            <label>
              Potassium (K)
              <input
                name="potassium"
                type="number"
                value={form.potassium}
                onChange={change}
              />
            </label>

            <label>
              Soil moisture (%)
              <input
                name="soil_moisture"
                type="number"
                min="0"
                max="100"
                value={form.soil_moisture}
                onChange={change}
              />
            </label>
          </div>

          <label>
            Notes
            <textarea
              name="notes"
              rows="3"
              value={form.notes}
              onChange={change}
            />
          </label>

          <div className="actions">
            <button
              type="button"
              className="secondary"
              onClick={() => setShow(false)}
            >
              Cancel
            </button>

            <button
              className="primary"
              disabled={busy}
            >
              {busy
                ? "Saving..."
                : "Save crop"}
            </button>
          </div>
        </form>
      )}

      {crops.length ? (
        <div className="cards-list">
          {crops.map((c) => (
            <div
              className="crop-card"
              key={c.id}
            >
              <div className="crop-main">
                <div className="crop-icon">
                  🌱
                </div>

                <div>
                  <h3>
                    {c.crop_type}
                    {c.variety
                      ? ` · ${c.variety}`
                      : ""}
                  </h3>

                  <p>
                    {c.area_acres} acres ·{" "}
                    {c.growth_stage} ·{" "}
                    {c.soil_type ||
                      "Soil not specified"}
                  </p>
                </div>
              </div>

              <button
                className="danger-link"
                onClick={() => remove(c.id)}
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      ) : (
        <Empty text="No crops added yet." />
      )}
    </>
  );
}

/* ================= DISEASE AI ================= */

/* ================= DISEASE AI ================= */

function DiseaseAI() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  function choose(e) {
    const f = e.target.files?.[0];

    if (!f) return;

    setFile(f);
    setPreview(URL.createObjectURL(f));
    setResult(null);
    setError("");
  }

  async function analyze() {
    if (!file) return;

    setBusy(true);
    setError("");
    setResult(null);

    try {
      const body = new FormData();
      body.append("image", file);

      const data = await api("/diagnosis", {
        method: "POST",
        body,
      });

      setResult(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  function getCropName(value) {
    if (!value) return "Unknown";

    const parts = String(value).split("___");

    return prettyLabel(parts[0]);
  }

  function getDiseaseName(value) {
    if (!value) return "Unknown";

    const parts = String(value).split("___");

    return prettyLabel(parts[1] || parts[0]);
  }

  function getConfidence(value) {
    const confidence = Number(value || 0);

    return Math.round(
      Math.max(0, Math.min(1, confidence)) * 100
    );
  }

  return (
    <>
      <div className="page-intro">
        <h2>Plant Disease AI</h2>

        <p>
          Upload a clear leaf image and the trained
          AI model will analyze the plant health.
        </p>
      </div>

      <div className="disease-layout">

        {/* UPLOAD */}

        <div className="upload-card">
          <div className="upload-zone">

            {preview ? (
              <img
                className="leaf-preview"
                src={preview}
                alt="Selected plant leaf"
              />
            ) : (
              <div className="upload-placeholder">
                <span>📷</span>

                <strong>
                  Upload leaf image
                </strong>

                <small>
                  JPG, JPEG, PNG or WebP
                </small>
              </div>
            )}

            <input
              id="leaf-file"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={choose}
            />

            <label
              htmlFor="leaf-file"
              className="secondary upload-button"
            >
              {file
                ? "Choose another image"
                : "Choose image"}
            </label>
          </div>

          {error && (
            <div className="alert error">
              {error}
            </div>
          )}

          <button
            className="primary wide"
            disabled={!file || busy}
            onClick={analyze}
          >
            {busy
              ? "Analyzing..."
              : "Analyze disease"}
          </button>
        </div>

        {/* RESULT */}

        <div className="result-card">

          <span className="eyebrow">
            AI RESULT
          </span>

          {!result ? (
            <div className="result-empty">
              <span>🩺</span>

              <h3>
                Awaiting analysis
              </h3>

              <p>
                Upload a plant leaf image and click
                "Analyze disease".
              </p>
            </div>
          ) : (
            <div className="result-content">

              <div className="result-badge">
                ✓{" "}
                {result.status === "success"
                  ? "Analysis complete"
                  : prettyLabel(
                      result.status ||
                        "Analysis complete"
                    )}
              </div>

              <h2>
                {getCropName(
                  result.predicted_class
                )}
              </h2>

              <div
                style={{
                  marginTop: "-8px",
                  marginBottom: "22px",
                  fontSize: "18px",
                  fontWeight: "600",
                }}
              >
                🌱{" "}
                {getDiseaseName(
                  result.predicted_class
                )}
              </div>

              <div className="recommendation-result">

                <div className="recommend-row">
                  <span>🌾 Crop</span>

                  <strong>
                    {getCropName(
                      result.predicted_class
                    )}
                  </strong>
                </div>

                <div className="recommend-row">
                  <span>
                    🦠 Disease / Health
                  </span>

                  <strong>
                    {getDiseaseName(
                      result.predicted_class
                    )}
                  </strong>
                </div>

                <div className="recommend-row">
                  <span>📊 Status</span>

                  <strong>
                    {result.status
                      ? prettyLabel(
                          result.status
                        )
                      : "Analysis complete"}
                  </strong>
                </div>

              </div>

              {/* CONFIDENCE */}

              <div className="confidence">

                <div>
                  <span>
                    🎯 Confidence
                  </span>

                  <strong>
                    {getConfidence(
                      result.confidence
                    )}
                    %
                  </strong>
                </div>

                <div className="bar">
                  <i
                    style={{
                      width: `${getConfidence(
                        result.confidence
                      )}%`,
                    }}
                  />
                </div>

              </div>

              {/* RECOMMENDATION */}

              <div
                style={{
                  marginTop: "24px",
                  padding: "18px",
                  borderRadius: "14px",
                  background: "#f1f8f4",
                  border: "1px solid #d8eee2",
                }}
              >
                <div
                  style={{
                    fontSize: "12px",
                    fontWeight: "700",
                    letterSpacing: "1px",
                    marginBottom: "8px",
                    textTransform: "uppercase",
                  }}
                >
                  💡 Recommendation
                </div>

                <p
                  style={{
                    margin: 0,
                    lineHeight: 1.6,
                  }}
                >
                  {result.recommendation ||
                    "No recommendation available for this result."}
                </p>
              </div>

              {/* DIAGNOSIS ID */}

              {result.id && (
                <div
                  style={{
                    marginTop: "16px",
                    fontSize: "12px",
                    opacity: 0.6,
                  }}
                >
                  Diagnosis ID: #{result.id}
                </div>
              )}

              <p
                className="muted"
                style={{
                  marginTop: "20px",
                }}
              >
                ⚠️ Use this result as an AI screening
                aid. For real-world treatment decisions,
                confirm the diagnosis with an agricultural
                expert.
              </p>

            </div>
          )}
        </div>
      </div>
    </>
  );
}

/* ================= RECOMMENDATIONS ================= */

function Recommendations() {
  const [type, setType] =
    useState("fertilizer");

  const [form, setForm] = useState({
    crop_type: "",
    soil_type: "",
    growth_stage: "vegetative",
    nitrogen: "",
    phosphorus: "",
    potassium: "",
    soil_moisture: "",
    temperature: "",
    rainfall: "",
  });

  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  function change(e) {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  }

  async function submit(e) {
    e.preventDefault();

    setBusy(true);
    setError("");
    setResult(null);

    try {
      const payload = { ...form };

      [
        "nitrogen",
        "phosphorus",
        "potassium",
        "soil_moisture",
        "temperature",
        "rainfall",
      ].forEach((k) => {
        payload[k] =
          form[k] === ""
            ? null
            : Number(form[k]);
      });

      const endpoint =
        type === "fertilizer"
          ? "/recommendations/fertilizer"
          : "/recommendations/irrigation";

      setResult(
        await api(endpoint, {
          method: "POST",
          body: JSON.stringify(payload),
        })
      );
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="page-intro">
        <h2>Smart Recommendations</h2>

        <p>
          Get fertilizer and irrigation guidance
          from your crop and soil inputs.
        </p>
      </div>

      <div className="tabs">
        <button
          className={
            type === "fertilizer"
              ? "tab active"
              : "tab"
          }
          onClick={() => {
            setType("fertilizer");
            setResult(null);
          }}
        >
          🧪 Fertilizer
        </button>

        <button
          className={
            type === "irrigation"
              ? "tab active"
              : "tab"
          }
          onClick={() => {
            setType("irrigation");
            setResult(null);
          }}
        >
          💧 Irrigation
        </button>
      </div>

      <form
        className="form-card"
        onSubmit={submit}
      >
        <div className="grid-2">
          <label>
            Crop type *
            <input
              name="crop_type"
              value={form.crop_type}
              onChange={change}
              required
              placeholder="Wheat"
            />
          </label>

          <label>
            Soil type
            <input
              name="soil_type"
              value={form.soil_type}
              onChange={change}
              placeholder="Loamy"
            />
          </label>

          <label>
            Growth stage
            <select
              name="growth_stage"
              value={form.growth_stage}
              onChange={change}
            >
              <option>seedling</option>
              <option>vegetative</option>
              <option>flowering</option>
              <option>fruiting</option>
              <option>maturity</option>
            </select>
          </label>

          <label>
            Soil moisture (%)
            <input
              name="soil_moisture"
              type="number"
              min="0"
              max="100"
              value={form.soil_moisture}
              onChange={change}
            />
          </label>

          <label>
            Nitrogen
            <input
              name="nitrogen"
              type="number"
              value={form.nitrogen}
              onChange={change}
            />
          </label>

          <label>
            Phosphorus
            <input
              name="phosphorus"
              type="number"
              value={form.phosphorus}
              onChange={change}
            />
          </label>

          <label>
            Potassium
            <input
              name="potassium"
              type="number"
              value={form.potassium}
              onChange={change}
            />
          </label>

          <label>
            Temperature °C
            <input
              name="temperature"
              type="number"
              value={form.temperature}
              onChange={change}
            />
          </label>

          <label>
            Rainfall mm
            <input
              name="rainfall"
              type="number"
              value={form.rainfall}
              onChange={change}
            />
          </label>
        </div>

        {error && (
          <div className="alert error">
            {error}
          </div>
        )}

        <button
          className="primary"
          disabled={busy}
        >
          {busy
            ? "Calculating..."
            : `Get ${type} recommendation`}
        </button>
      </form>

      {result && (
        <RecommendationResult data={result} />
      )}
    </>
  );
}

function RecommendationResult({ data }) {
  const entries = Object.entries(data).filter(
    ([, v]) =>
      v !== null &&
      v !== undefined &&
      typeof v !== "object"
  );

  return (
    <div className="result-card recommendation-result">
      <span className="eyebrow">
        RECOMMENDATION
      </span>

      <h3>Suggested farm guidance</h3>

      {entries.length ? (
        entries.map(([k, v]) => (
          <div
            className="recommend-row"
            key={k}
          >
            <span>{prettyLabel(k)}</span>

            <strong>{String(v)}</strong>
          </div>
        ))
      ) : (
        <pre>
          {JSON.stringify(data, null, 2)}
        </pre>
      )}
    </div>
  );
}

/* ================= WEATHER ================= */

function Weather({ user }) {
  const [city, setCity] = useState(
    user?.city || localStorage.getItem("weather_city") || "Delhi"
  );
  const [results, setResults] = useState([]);
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);

  function weatherText(code) {
    if (code === 0) return "Clear sky";
    if ([1, 2, 3].includes(code)) return "Partly cloudy";
    if ([45, 48].includes(code)) return "Fog";
    if ([51, 53, 55, 56, 57].includes(code)) return "Drizzle";
    if ([61, 63, 65, 66, 67].includes(code)) return "Rain";
    if ([71, 73, 75, 77].includes(code)) return "Snow";
    if ([80, 81, 82].includes(code)) return "Rain showers";
    if ([95, 96, 99].includes(code)) return "Thunderstorm";
    return "Current conditions";
  }

  async function loadLocation(location) {
    setBusy(true);
    setError("");
    setOpen(false);

    try {
      const url =
        `https://api.open-meteo.com/v1/forecast` +
        `?latitude=${location.latitude}` +
        `&longitude=${location.longitude}` +
        `&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,precipitation` +
        `&timezone=auto`;

      const response = await fetch(url);
      if (!response.ok) throw new Error("Weather service unavailable");

      const w = await response.json();

      setData({
        city: location.name,
        country: location.country,
        description: weatherText(w.current.weather_code),
        temperature: Math.round(w.current.temperature_2m),
        humidity: w.current.relative_humidity_2m,
        wind_speed: Math.round(w.current.wind_speed_10m),
        rainfall: w.current.precipitation
      });

      setCity(location.name);
      localStorage.setItem("weather_city", location.name);
    } catch (e) {
      setError("Weather data load nahi ho pa raha.");
    } finally {
      setBusy(false);
    }
  }

  async function searchCity(value) {
    setCity(value);

    if (value.trim().length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }

    try {
      const response = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
          value.trim()
        )}&count=7&language=en&format=json`
      );

      const json = await response.json();
      setResults(json.results || []);
      setOpen(true);
    } catch {
      setResults([]);
      setOpen(false);
    }
  }

  async function load(e) {
    e?.preventDefault();

    if (results.length > 0) {
      await loadLocation(results[0]);
      return;
    }

    if (!city.trim()) return;

    setBusy(true);
    setError("");

    try {
      const response = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
          city.trim()
        )}&count=1&language=en&format=json`
      );

      const json = await response.json();

      if (!json.results?.length) {
        setError("Location not found");
        return;
      }

      await loadLocation(json.results[0]);
    } catch {
      setError("Location search failed.");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    const saved = user?.city || localStorage.getItem("weather_city") || "Delhi";

    fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
        saved
      )}&count=1&language=en&format=json`
    )
      .then((r) => r.json())
      .then((json) => {
        if (json.results?.[0]) {
          loadLocation(json.results[0]);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <>
      <div className="page-intro">
        <h2>Weather</h2>
        <p>
          Check current weather conditions for your farming location.
        </p>
      </div>

      <form className="weather-search" onSubmit={load}>
        <div style={{ position: "relative", flex: 1 }}>
          <input
            value={city}
            onChange={(e) => searchCity(e.target.value)}
            onFocus={() => results.length > 0 && setOpen(true)}
            placeholder="Search city, e.g. Delhi"
            autoComplete="off"
            style={{ width: "100%" }}
          />

          {open && results.length > 0 && (
            <div
              style={{
                position: "absolute",
                top: "calc(100% + 5px)",
                left: 0,
                right: 0,
                background: "#fff",
                border: "1px solid #d9e4df",
                borderRadius: "10px",
                boxShadow: "0 8px 25px rgba(0,0,0,.15)",
                zIndex: 1000,
                overflow: "hidden"
              }}
            >
              {results.map((x, i) => (
                <div
                  key={`${x.latitude}-${x.longitude}-${i}`}
                  onMouseDown={() => loadLocation(x)}
                  style={{
                    padding: "12px 15px",
                    cursor: "pointer",
                    borderBottom: "1px solid #eee"
                  }}
                >
                  <strong>📍 {x.name}</strong>
                  <div style={{ fontSize: "12px", color: "#777" }}>
                    {[x.admin1, x.country].filter(Boolean).join(", ")}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <button className="primary" disabled={busy}>
          {busy ? "Loading..." : "Check weather"}
        </button>
      </form>

      {error && (
        <div className="alert error">
          {error}
        </div>
      )}

      {data && (
        <div className="weather-card">
          <div className="weather-main">
            <span className="weather-icon">🌦️</span>

            <div>
              <h2>
                {data.city}, {data.country}
              </h2>
              <p>{data.description}</p>
            </div>
          </div>

          <div className="weather-grid">
            {[
              ["🌡️", "Temperature", data.temperature, "°C"],
              ["💧", "Humidity", data.humidity, "%"],
              ["💨", "Wind", data.wind_speed, " km/h"],
              ["🌧️", "Rainfall", data.rainfall, " mm"],
            ].map(([i, t, v, u]) => (
              <div key={t}>
                <span>{i}</span>
                <small>{t}</small>
                <strong>
                  {v}
                  {u}
                </strong>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

/* ================= AI ASSISTANT ================= */

function Assistant() {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);

  const quick = [
    "How often should I irrigate wheat?",
    "How can I improve soil nitrogen?",
    "What should I do if leaves have spots?",
  ];

  /*
    IMPORTANT:
    Chat history intentionally NOT loaded here.
    Every page refresh starts with a fresh chat.
  */

  async function send(value = text) {
    const message = value.trim();

    if (!message || busy) return;

    setText("");
    setBusy(true);

    // Show user's message immediately.
    setMessages((m) => [
      ...m,
      {
        role: "user",
        message,
      },
    ]);

    try {
      const data = await api("/chat", {
        method: "POST",
        body: JSON.stringify({
          message,
        }),
      });

      const answer =
        data.response ||
        data.reply ||
        data.message ||
        data.answer ||
        "I could not generate a response.";

      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          message: answer,
        },
      ]);
    } catch (e) {
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          message: e.message,
        },
      ]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="page-intro">
        <h2>AI Farming Assistant</h2>

        <p>
          Ask practical questions about crops,
          irrigation, fertilizer and plant health.
        </p>
      </div>

      <div className="chat-card">
        <div className="quick-questions">
          {quick.map((q) => (
            <button
              key={q}
              onClick={() => send(q)}
              disabled={busy}
            >
              {q}
            </button>
          ))}
        </div>

        <div className="chat-messages">
          {!messages.length && (
            <div className="chat-welcome">
              <span>🤖</span>

              <h3>Hello, farmer!</h3>

              <p>
                Ask me a farming question to get
                started.
              </p>
            </div>
          )}

          {messages.map((m, i) => (
            <div
              key={i}
              className={`chat-msg ${
                m.role === "user"
                  ? "user"
                  : "assistant"
              }`}
            >
              <div>
                {m.message ||
                  m.content ||
                  m.text}
              </div>
            </div>
          ))}

          {busy && (
            <div className="chat-msg assistant">
              <div>
                Thinking... 🌱
              </div>
            </div>
          )}
        </div>

        <div className="chat-input">
          <input
            value={text}
            onChange={(e) =>
              setText(e.target.value)
            }
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                send();
              }
            }}
            placeholder="Ask your farming question..."
            disabled={busy}
          />

          <button
            className="primary"
            onClick={() => send()}
            disabled={busy || !text.trim()}
          >
            {busy ? "Sending..." : "Send"}
          </button>
        </div>
      </div>
    </>
  );
}

/* ================= PROFILE ================= */

function Profile({ user, onSaved }) {
  const [form, setForm] = useState({
    full_name: user.full_name || "",
    phone: user.phone || "",
    city: user.city || "",
    state: user.state || "",
    farm_size_acres:
      user.farm_size_acres ?? "",
    soil_type: user.soil_type || "",
    latitude: user.latitude ?? "",
    longitude: user.longitude ?? "",
  });

  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  function change(e) {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  }

  async function submit(e) {
    e.preventDefault();

    setSaved(false);
    setError("");

    try {
      const payload = {
        ...form,

        farm_size_acres:
          form.farm_size_acres === ""
            ? null
            : Number(form.farm_size_acres),

        latitude:
          form.latitude === ""
            ? null
            : Number(form.latitude),

        longitude:
          form.longitude === ""
            ? null
            : Number(form.longitude),
      };

      await api("/profile", {
        method: "PUT",
        body: JSON.stringify(payload),
      });

      setSaved(true);
      onSaved();
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <>
      <div className="page-intro">
        <h2>Farmer Profile</h2>

        <p>
          Keep your farm information updated for
          personalized assistance.
        </p>
      </div>

      <form
        className="form-card"
        onSubmit={submit}
      >
        <div className="grid-2">
          <label>
            Full name
            <input
              name="full_name"
              value={form.full_name}
              onChange={change}
              required
            />
          </label>

          <label>
            Phone
            <input
              name="phone"
              value={form.phone}
              onChange={change}
            />
          </label>

          <label>
            Email
            <input
              value={user.email || ""}
              disabled
            />
          </label>

          <label>
            Farm size (acres)
            <input
              name="farm_size_acres"
              type="number"
              min="0"
              step="0.01"
              value={form.farm_size_acres}
              onChange={change}
            />
          </label>

          <label>
            City
            <input
              name="city"
              value={form.city}
              onChange={change}
            />
          </label>

          <label>
            State
            <input
              name="state"
              value={form.state}
              onChange={change}
            />
          </label>

          <label>
            Soil type
            <input
              name="soil_type"
              value={form.soil_type}
              onChange={change}
            />
          </label>

          <label>
            Latitude
            <input
              name="latitude"
              type="number"
              step="any"
              value={form.latitude}
              onChange={change}
            />
          </label>

          <label>
            Longitude
            <input
              name="longitude"
              type="number"
              step="any"
              value={form.longitude}
              onChange={change}
            />
          </label>
        </div>

        {error && (
          <div className="alert error">
            {error}
          </div>
        )}

        {saved && (
          <div className="alert success">
            Profile saved successfully.
          </div>
        )}

        <button className="primary">
          Save profile
        </button>
      </form>
    </>
  );
}

/* ================= HELPERS ================= */

function LoadingCard() {
  return (
    <div className="center-card">
      <div className="loader"></div>
      <p>Loading...</p>
    </div>
  );
}

function Empty({ text }) {
  return (
    <div className="empty">
      <span>🌱</span>
      <p>{text}</p>
    </div>
  );
}

function prettyLabel(value) {
  return String(value || "")
    .replace(/___/g, " — ")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) =>
      c.toUpperCase()
    );
}

createRoot(
  document.getElementById("root")
).render(<App />);
function LiveWeather(){
  const [city,setCity]=useState("Delhi");
  const [results,setResults]=useState([]);
  const [weather,setWeather]=useState(null);
  const [loading,setLoading]=useState(false);
  const [open,setOpen]=useState(false);

  const condition=(c)=>{
    if(c===0) return "Clear";
    if(c<=3) return "Partly Cloudy";
    if(c<=48) return "Foggy";
    if(c<=67) return "Rain";
    if(c<=77) return "Snow";
    if(c<=82) return "Rain Showers";
    return "Thunderstorm";
  };

  const loadWeather=async(x)=>{
    setLoading(true);
    try{
      const r=await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${x.latitude}&longitude=${x.longitude}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&timezone=auto`
      );
      const d=await r.json();
      setWeather({
        temp:Math.round(d.current.temperature_2m),
        humidity:d.current.relative_humidity_2m,
        wind:Math.round(d.current.wind_speed_10m),
        text:condition(d.current.weather_code),
        name:x.name
      });
      setCity(x.name);
      localStorage.setItem("weather_city",x.name);
    }catch(e){
      setWeather(null);
    }finally{
      setLoading(false);
    }
  };

  const search=async(v)=>{
    setCity(v);
    if(v.trim().length<2){setResults([]);return;}
    try{
      const r=await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(v)}&count=6&language=en&format=json`
      );
      const d=await r.json();
      setResults(d.results||[]);
      setOpen(true);
    }catch(e){
      setResults([]);
    }
  };

  useEffect(()=>{
    const saved=localStorage.getItem("weather_city")||"Delhi";
    fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(saved)}&count=1&language=en&format=json`
    )
    .then(r=>r.json())
    .then(d=>{
      if(d.results?.[0]) loadWeather(d.results[0]);
    });
  },[]);

  return (
    <div style={{position:"relative",minWidth:150}}>
      <div style={{fontSize:24,fontWeight:800,lineHeight:1}}>
        {loading ? "..." : weather ? `${weather.temp}°C` : "--°C"}
      </div>

      <input
        value={city}
        onChange={e=>search(e.target.value)}
        onFocus={()=>city.length>=2&&setOpen(true)}
        placeholder="Search city"
        style={{
          width:"145px",
          marginTop:"6px",
          padding:"5px 8px",
          border:"1px solid #d8e3dc",
          borderRadius:"7px",
          fontSize:"12px",
          outline:"none"
        }}
      />

      {weather && (
        <div style={{fontSize:11,color:"#718078",marginTop:3}}>
          {weather.text} · 💧{weather.humidity}% · 💨{weather.wind} km/h
        </div>
      )}

      {open && results.length>0 && (
        <div style={{
          position:"absolute",
          top:"74px",
          left:0,
          width:"190px",
          background:"#fff",
          border:"1px solid #ddd",
          borderRadius:"8px",
          boxShadow:"0 8px 20px rgba(0,0,0,.15)",
          zIndex:9999,
          overflow:"hidden"
        }}>
          {results.map((x,i)=>(
            <div
              key={i}
              onMouseDown={()=>{
                setOpen(false);
                loadWeather(x);
              }}
              style={{
                padding:"8px 10px",
                cursor:"pointer",
                fontSize:"12px",
                borderBottom:"1px solid #eee"
              }}
            >
              📍 {x.name}{x.admin1 ? `, ${x.admin1}` : ""}<br/>
              <span style={{color:"#888"}}>{x.country}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

