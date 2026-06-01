import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { mvcApi, riskBadgeClass } from '../../../services/mvcApi.js';

export default function Homepage() {
  // 1. Hero Carousel State
  const [currentSlide, setCurrentSlide] = useState(0);
  const heroSlides = [
    {
      img: '/assets/img/hero-carousel/hero-carousel-1.jpg',
      title: 'Welcome to DermaScan',
      text: 'Advanced AI and Machine Learning to detect melanoma from a simple smartphone photo. Early detection saves lives.',
      link: '#how-it-works',
      linkText: 'Learn More'
    },
    {
      img: '/assets/img/hero-carousel/hero-carousel-2.jpg',
      title: 'Powered by Machine Learning',
      text: 'Our algorithms have been trained on thousands of dermatoscopic images to accurately identify malignant melanomas and benign moles.',
      link: '#call-to-action',
      linkText: 'Get Started'
    },
    {
      img: '/assets/img/hero-carousel/hero-carousel-3.jpg',
      title: 'Lab Two Academic Project',
      text: 'Built by a dedicated team of four students, DermaScan represents the intersection of healthcare and cutting-edge artificial intelligence.',
      link: '#team',
      linkText: 'Meet the Team'
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + heroSlides.length) % heroSlides.length);
  };

  // 2. ABCDE Tabs State
  const [activeTab, setActiveTab] = useState(0);
  const abcdeTabs = [
    {
      id: 'tabs-tab-1',
      title: 'A - Asymmetry',
      subtitle: 'Asymmetry',
      italic: 'One half of the mole does not match the other.',
      desc: 'Normal moles or freckles are completely symmetrical. If you draw a line through a normal spot, you will have two symmetrical halves. In cases of skin cancer, spots will not look the same on both sides.',
      img: '/assets/img/departments-1.jpg'
    },
    {
      id: 'tabs-tab-2',
      title: 'B - Border',
      subtitle: 'Border',
      italic: 'The edges are irregular, ragged, notched, or blurred.',
      desc: 'A normal mole has smooth, even borders, unlike melanomas. The borders of an early melanoma tend to be uneven. The edges may be scalloped or notched.',
      img: '/assets/img/departments-2.jpg'
    },
    {
      id: 'tabs-tab-3',
      title: 'C - Color',
      subtitle: 'Color',
      italic: 'The color is not the same all over.',
      desc: 'Most benign moles are all one color—often a single shade of brown. Having a variety of colors is another warning signal. A number of different shades of brown, tan or black could appear. A melanoma may also become red, white or blue.',
      img: '/assets/img/departments-3.jpg'
    },
    {
      id: 'tabs-tab-4',
      title: 'D - Diameter',
      subtitle: 'Diameter',
      italic: 'The spot is larger than 6 millimeters across.',
      desc: 'Melanomas usually are larger in diameter than the eraser on your pencil tip (¼ inch or 6mm), but they may sometimes be smaller when first detected.',
      img: '/assets/img/departments-4.jpg'
    },
    {
      id: 'tabs-tab-5',
      title: 'E - Evolving',
      subtitle: 'Evolving',
      italic: 'The mole is changing in size, shape, or color.',
      desc: 'Any change—in size, shape, color, elevation, or another trait, or any new symptom such as bleeding, itching or crusting—points to danger.',
      img: '/assets/img/departments-5.jpg'
    }
  ];

  // 3. FAQ State
  const [activeFaq, setActiveFaq] = useState(null);
  const toggleFaq = (index) => {
    setActiveFaq(activeFaq === index ? null : index);
  };
  const faqs = [
    {
      q: 'Is DermaScan a replacement for a dermatologist?',
      a: 'No. DermaScan is an educational and preliminary screening tool. It uses AI to provide a risk assessment, but it cannot formally diagnose melanoma. Always consult a medical professional for accurate diagnosis.'
    },
    {
      q: 'How accurate is the AI model?',
      a: 'Our model has been trained on a large dataset of dermatoscopic images and achieves a high accuracy rate in our testing. However, lighting conditions, camera quality, and skin variations can affect results in real-world usage.'
    },
    {
      q: 'What is Lab Two?',
      a: 'Lab Two is our university course where we are tasked with building a complete software solution. We chose to build DermaScan to apply our machine learning and web development skills to a real-world problem.'
    },
    {
      q: 'Are my uploaded photos kept private?',
      a: 'Yes. Images uploaded for scanning are processed momentarily by our server and are not stored permanently without your explicit consent.'
    }
  ];
  // 4. Scan Interaction State & Handlers
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('dermascan_user');
    const token = localStorage.getItem('dermascan_access_token');
    if (savedUser && token) {
      setUser(JSON.parse(savedUser));
    } else {
      setUser(null);
    }
  }, []);

  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [symptoms, setSymptoms] = useState('');
  const [scanState, setScanState] = useState('idle'); // idle, scanning, completed
  const [scanProgress, setScanProgress] = useState(0);
  const [scanResult, setScanResult] = useState(null);
  const [scanError, setScanError] = useState('');

  const handleBrowseClick = () => {
    if (!user) {
      navigate('/app', { state: { view: 'login' } });
    } else {
      fileInputRef.current?.click();
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setScanState('idle');
      setScanResult(null);
      setScanError('');
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (!user) {
      navigate('/app', { state: { view: 'login' } });
      return;
    }
    const file = e.dataTransfer.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setScanState('idle');
      setScanResult(null);
      setScanError('');
    }
  };

  const startScan = async (e) => {
    e.preventDefault();
    if (!selectedFile) return;
    if (!user) {
      navigate('/app', { state: { view: 'login' } });
      return;
    }

    setScanState('scanning');
    setScanProgress(15);
    setScanError('');

    try {
      setScanProgress(40);
      const scanSession = await mvcApi.createScan(symptoms || null);
      setScanProgress(70);
      const completedScan = await mvcApi.uploadScanImages(scanSession.id, [selectedFile]);
      setScanProgress(100);
      setScanResult(completedScan);
      setScanState('completed');
    } catch (error) {
      setScanState('idle');
      setScanError(error.message || 'Scan failed. Please try again.');
    }
  };

  const handleDownloadReport = () => {
    if (scanResult) {
      mvcApi.downloadScanReport(scanResult.id);
    }
  };

  const resetScan = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setSymptoms('');
    setScanState('idle');
    setScanResult(null);
    setScanError('');
  };

  return (
    <main className="main">
      {/* Hero Section */}
      <section id="hero" className="hero section">
        <div id="hero-carousel" className="carousel slide carousel-fade">
          <div className="carousel-inner">
            {heroSlides.map((slide, idx) => (
              <div key={idx} className={`carousel-item ${idx === currentSlide ? 'active' : ''}`} style={{ transition: 'opacity 0.8s ease-in-out' }}>
                <img src={slide.img} alt="" style={{ width: '100%', objectFit: 'cover', height: '60svh', minHeight: '450px' }} />
                <div className="container">
                  <h2>{slide.title}</h2>
                  <p>{slide.text}</p>
                  <a href={slide.link} className="btn-get-started">{slide.linkText}</a>
                </div>
              </div>
            ))}
          </div>

          <button className="carousel-control-prev border-0 bg-transparent" type="button" onClick={prevSlide}>
            <span className="carousel-control-prev-icon bi bi-chevron-left" aria-hidden="true"></span>
          </button>
          <button className="carousel-control-next border-0 bg-transparent" type="button" onClick={nextSlide}>
            <span className="carousel-control-next-icon bi bi-chevron-right" aria-hidden="true"></span>
          </button>

          <ol className="carousel-indicators">
            {heroSlides.map((_, idx) => (
              <li 
                key={idx} 
                className={idx === currentSlide ? 'active' : ''} 
                onClick={() => setCurrentSlide(idx)}
                style={{ cursor: 'pointer' }}
              ></li>
            ))}
          </ol>
        </div>
      </section>

      {/* Featured Services Section (Key Features) */}
      <section id="features" className="featured-services section">
        <div className="container">
          <div className="row gy-4">
            <div className="col-xl-3 col-md-6 d-flex">
              <div className="service-item position-relative">
                <div className="icon"><i className="fas fa-robot"></i></div>
                <h4><a href="#features" className="stretched-link">AI Powered</a></h4>
                <p>State-of-the-art convolutional neural networks analyze your skin lesions.</p>
              </div>
            </div>
            <div className="col-xl-3 col-md-6 d-flex">
              <div className="service-item position-relative">
                <div className="icon"><i className="fas fa-bolt"></i></div>
                <h4><a href="#features" className="stretched-link">Instant Results</a></h4>
                <p>Get immediate risk assessment and classification within seconds.</p>
              </div>
            </div>
            <div className="col-xl-3 col-md-6 d-flex">
              <div className="service-item position-relative">
                <div className="icon"><i className="fas fa-mobile-alt"></i></div>
                <h4><a href="#features" className="stretched-link">Mobile Friendly</a></h4>
                <p>Take a photo with your smartphone and upload directly to our platform.</p>
              </div>
            </div>
            <div className="col-xl-3 col-md-6 d-flex">
              <div className="service-item position-relative">
                <div className="icon"><i className="fas fa-lock"></i></div>
                <h4><a href="#features" className="stretched-link">Privacy First</a></h4>
                <p>Your photos are processed securely and are never shared without consent.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call To Action Section */}
      <section id="call-to-action" className="call-to-action section accent-background">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-xl-10">
              <div className="text-center">
                <h3>Notice a suspicious mole?</h3>
                <p>Early detection of melanoma drastically increases survival rates. Use our AI tool to get an initial assessment, but always consult a dermatologist for a professional diagnosis.</p>
                <Link className="cta-btn" to="/app">Start Scan</Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="about section">
        <div className="container section-title">
          <h2>About The Project</h2>
          <p>DermaScan is an academic initiative developed for our Lab Two subject.</p>
        </div>
        <div className="container">
          <div className="row gy-4">
            <div className="col-lg-6 position-relative align-self-start">
              <img src="/assets/img/about.jpg" className="img-fluid rounded" alt="About DermaScan" />
            </div>
            <div className="col-lg-6 content">
              <h3>Bridging the gap between Technology and Dermatology</h3>
              <p className="fst-italic">
                Our team of four students embarked on a journey to create a meaningful tool that leverages machine learning for healthcare.
              </p>
              <ul>
                <li><i className="bi bi-check2-all text-primary me-2"></i> <span>Developed specifically for the Lab Two curriculum.</span></li>
                <li><i className="bi bi-check2-all text-primary me-2"></i> <span>Utilizes deep learning models trained on large datasets of skin lesions.</span></li>
                <li><i className="bi bi-check2-all text-primary me-2"></i> <span>Aims to provide a free, accessible pre-screening tool for everyone.</span></li>
              </ul>
              <p>
                We realized that many people ignore potentially dangerous skin changes. By providing an easy-to-use web application, we hope to encourage users to monitor their skin health and seek medical advice when our AI detects a high risk of melanoma.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section id="stats" className="stats section">
        <div className="container">
          <div className="row gy-4">
            <div className="col-lg-3 col-md-6">
              <div className="stats-item d-flex align-items-center w-100 h-100">
                <i className="fas fa-users flex-shrink-0"></i>
                <div>
                  <span className="purecounter fw-bold" style={{ fontSize: '28px' }}>4</span>
                  <p>Team Members</p>
                </div>
              </div>
            </div>
            <div className="col-lg-3 col-md-6">
              <div className="stats-item d-flex align-items-center w-100 h-100">
                <i className="fas fa-images flex-shrink-0"></i>
                <div>
                  <span className="purecounter fw-bold" style={{ fontSize: '28px' }}>10,000+</span>
                  <p>Training Images</p>
                </div>
              </div>
            </div>
            <div className="col-lg-3 col-md-6">
              <div className="stats-item d-flex align-items-center w-100 h-100">
                <i className="fas fa-percent flex-shrink-0"></i>
                <div>
                  <span className="purecounter fw-bold" style={{ fontSize: '28px' }}>92%</span>
                  <p>Accuracy Rate</p>
                </div>
              </div>
            </div>
            <div className="col-lg-3 col-md-6">
              <div className="stats-item d-flex align-items-center w-100 h-100">
                <i className="fas fa-clock flex-shrink-0"></i>
                <div>
                  <span className="purecounter fw-bold" style={{ fontSize: '28px' }}>240</span>
                  <p>Hours Coded</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="services section">
        <div className="container section-title">
          <h2>How It Works</h2>
          <p>Four simple steps to check your skin health</p>
        </div>
        <div className="container">
          <div className="row gy-4">
            <div className="col-lg-3 col-md-6">
              <div className="service-item position-relative">
                <div className="icon"><i className="fas fa-camera"></i></div>
                <h3>1. Take a Photo</h3>
                <p>Use your phone to take a clear, well-lit, close-up photo of the mole or skin lesion you want to check.</p>
              </div>
            </div>
            <div className="col-lg-3 col-md-6">
              <div className="service-item position-relative">
                <div className="icon"><i className="fas fa-upload"></i></div>
                <h3>2. Upload Image</h3>
                <p>Upload the image directly to our secure DermaScan platform using the tool below.</p>
              </div>
            </div>
            <div className="col-lg-3 col-md-6">
              <div className="service-item position-relative">
                <div className="icon"><i className="fas fa-microchip"></i></div>
                <h3>3. AI Analysis</h3>
                <p>Our machine learning model analyzes the image for patterns indicative of melanoma.</p>
              </div>
            </div>
            <div className="col-lg-3 col-md-6">
              <div className="service-item position-relative">
                <div className="icon"><i className="fas fa-file-medical-alt"></i></div>
                <h3>4. View Results</h3>
                <p>Receive an instant probability score. If the risk is high, we strongly advise consulting a doctor.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Restored Scan Section */}
      <section id="scan" className="appointment section light-background">
        <div className="container section-title">
          <h2>Scan Your Mole</h2>
          <p>Upload a clear image of your skin lesion for AI analysis</p>
        </div>
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-lg-8 card border-0 shadow-sm p-4" style={{ borderRadius: '24px', backgroundColor: '#ffffff' }}>
              <form onSubmit={startScan}>
                <div className="form-group mb-3">
                  <label className="form-label fw-semibold text-secondary">Upload Image of Lesion</label>
                  
                  {/* File input (hidden) */}
                  <input
                    type="file"
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                    accept="image/*"
                    onChange={handleFileChange}
                  />

                  {/* Drag and Drop Container (matching screenshot) */}
                  <div
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    onClick={handleBrowseClick}
                    className="text-center cursor-pointer p-4 d-flex flex-column align-items-center justify-content-center"
                    style={{
                      minHeight: '220px',
                      backgroundColor: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: '16px',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    {!previewUrl ? (
                      <>
                        <i className="bi bi-cloud-arrow-up text-primary" style={{ fontSize: '54px', color: '#2563eb' }}></i>
                        <p className="mt-2 mb-1 fw-bold text-dark" style={{ fontSize: '16px', color: '#1e293b' }}>
                          Drag & drop your skin photo here
                        </p>
                        <p className="text-muted small mb-2">Supports JPG, PNG (Max 5MB)</p>
                        <button
                          type="button"
                          className="btn btn-primary"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleBrowseClick();
                          }}
                          style={{
                            backgroundColor: '#2563eb',
                            borderColor: '#2563eb',
                            borderRadius: '6px',
                            padding: '8px 18px',
                            fontWeight: '600',
                            fontSize: '14px',
                          }}
                        >
                          Browse Image
                        </button>
                      </>
                    ) : (
                      <div className="position-relative w-100 text-center" onClick={(e) => e.stopPropagation()}>
                        <img
                          src={previewUrl}
                          alt="Skin Lesion Preview"
                          className="img-fluid rounded-3"
                          style={{ maxHeight: '200px', objectFit: 'contain' }}
                        />
                        {scanState === 'scanning' && (
                          <div
                            className="position-absolute w-100 start-0"
                            style={{
                              height: '4px',
                              background: 'linear-gradient(to right, transparent, #ff3b3b, transparent)',
                              boxShadow: '0 0 12px #ff3b3b',
                              top: '50%',
                              animation: 'scanLaser 2s infinite ease-in-out',
                            }}
                          ></div>
                        )}
                        {scanState === 'idle' && (
                          <button
                            type="button"
                            className="btn btn-sm btn-danger position-absolute top-0 end-0 m-1 rounded-circle"
                            onClick={resetScan}
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Symptoms Text Area */}
                <div className="form-group mb-3">
                  <textarea
                    className="form-control"
                    rows="3"
                    value={symptoms}
                    onChange={(e) => setSymptoms(e.target.value)}
                    placeholder="Any additional symptoms (itching, bleeding, changing shape)?"
                    style={{ borderRadius: '12px', border: '1px solid #cbd5e1', padding: '12px' }}
                  ></textarea>
                </div>

                {/* Scan Status / Error Feedback */}
                {scanState === 'scanning' && (
                  <div className="mt-3 text-center text-primary fw-bold">
                    <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                    Running Neural Network Mole Scan...
                    <div className="progress mt-3 mx-auto" style={{ maxWidth: '400px', height: '8px', borderRadius: '4px' }}>
                      <div className="progress-bar bg-primary" role="progressbar" style={{ width: `${scanProgress}%` }}></div>
                    </div>
                  </div>
                )}

                {scanError && (
                  <div className="alert alert-danger rounded-3 p-3 mt-3">
                    <i className="bi bi-exclamation-octagon-fill me-2"></i>
                    {scanError}
                  </div>
                )}

                {/* Scan Result Feedback (if completed) */}
                {scanState === 'completed' && scanResult && (
                  <div className="mt-4 alert alert-success border-0 shadow-sm rounded-4 p-4" style={{ background: '#f0fdf4', color: '#15803d' }}>
                    <div className="d-flex align-items-center mb-3">
                      <i className="bi bi-check-circle-fill me-2 fs-4 text-success"></i>
                      <h4 className="alert-heading m-0 fw-bold">Analysis Complete!</h4>
                    </div>
                    <div className="row gy-3">
                      <div className="col-md-6 border-end">
                        <p className="text-secondary small mb-1">CLASSIFICATION RESULT</p>
                        <p className="fw-bold fs-5 text-dark">{scanResult.classification_label || 'Analysis Complete'}</p>
                      </div>
                      <div className="col-md-3 border-end text-center">
                        <p className="text-secondary small mb-1">CONFIDENCE</p>
                        <p className="fw-bold fs-5 text-dark">{scanResult.confidence_score}%</p>
                      </div>
                      <div className="col-md-3 text-center">
                        <p className="text-secondary small mb-1">RISK LEVEL</p>
                        <span className={`badge bg-${riskBadgeClass(scanResult.risk_level)} px-3 py-2 fs-6 rounded-pill`}>
                          {scanResult.risk_level || 'Low Risk'}
                        </span>
                      </div>
                    </div>
                    <hr className="my-3" style={{ opacity: 0.15 }} />
                    <p className="mb-0 text-dark" style={{ lineHeight: '1.6' }}>{scanResult.report_summary}</p>
                    <div className="mt-3 d-flex gap-2">
                      {scanResult.report_url && (
                        <button type="button" className="btn btn-sm btn-outline-success" onClick={handleDownloadReport}>
                          <i className="bi bi-file-earmark-pdf me-1"></i> Download PDF Report
                        </button>
                      )}
                      <button type="button" className="btn btn-sm btn-success" onClick={() => navigate('/app', { state: { view: 'dashboard', openSupport: true } })}>
                        <i className="bi bi-telephone-outbound me-1"></i> Consult Voice Doctor
                      </button>
                    </div>
                  </div>
                )}

                {/* Conditional Actions based on Authentication */}
                {!user ? (
                  <>
                    <p className="text-center small text-muted mb-3">
                      Sign in is required to upload images and generate PDF reports.
                    </p>
                    <div className="text-center">
                      <button
                        type="button"
                        onClick={() => navigate('/app', { state: { view: 'login' } })}
                        className="btn text-white px-5 rounded-pill shadow-sm"
                        style={{
                          backgroundColor: '#3fbbc0',
                          borderColor: '#3fbbc0',
                          fontWeight: '600',
                          padding: '12px 30px',
                        }}
                      >
                        Sign In to Scan Your Skin
                      </button>
                    </div>
                  </>
                ) : (
                  scanState !== 'completed' && (
                    <div className="text-center mt-3">
                      <button
                        type="submit"
                        disabled={!selectedFile || scanState === 'scanning'}
                        className="btn text-white px-5 rounded-pill shadow-sm"
                        style={{
                          backgroundColor: '#3fbbc0',
                          borderColor: '#3fbbc0',
                          fontWeight: '600',
                          padding: '12px 30px',
                        }}
                      >
                        {scanState === 'scanning' ? 'Scanning...' : 'Analyze Skin Image'}
                      </button>
                    </div>
                  )
                )}

                {scanState === 'completed' && (
                  <div className="text-center mt-3">
                    <button type="button" className="btn btn-outline-secondary rounded-pill px-4" onClick={resetScan}>
                      Scan Another Image
                    </button>
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* ABCDE Rule Section */}
      <section id="abcde" className="tabs section">
        <div className="container section-title">
          <h2>The ABCDE Rule of Melanoma</h2>
          <p>Knowing what to look for can help you spot melanoma early.</p>
        </div>
        <div className="container">
          <div className="row">
            <div className="col-lg-3">
              <ul className="nav nav-tabs flex-column border-0">
                {abcdeTabs.map((tab, idx) => (
                  <li key={idx} className="nav-item">
                    <button 
                      className={`nav-link text-start border-0 w-100 ${idx === activeTab ? 'active show' : ''}`}
                      onClick={() => setActiveTab(idx)}
                      style={{ transition: 'all 0.3s' }}
                    >
                      {tab.title}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            <div className="col-lg-9 mt-4 mt-lg-0">
              <div className="tab-content">
                {abcdeTabs.map((tab, idx) => (
                  <div key={idx} className={`tab-pane ${idx === activeTab ? 'active show' : ''}`}>
                    <div className="row gy-4">
                      <div className="col-lg-8 details order-2 order-lg-1">
                        <h3>{tab.subtitle}</h3>
                        <p className="fst-italic text-primary">{tab.italic}</p>
                        <p className="text-secondary" style={{ lineHeight: '1.7' }}>{tab.desc}</p>
                      </div>
                      <div className="col-lg-4 text-center order-1 order-lg-2">
                        <img src={tab.img} alt={tab.subtitle} className="img-fluid rounded shadow-sm" style={{ maxHeight: '200px' }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section id="team" className="doctors section light-background">
        <div className="container section-title">
          <h2>Our Team</h2>
          <p>The four developers behind DermaScan for Lab Two.</p>
        </div>
        <div className="container">
          <div className="row gy-4 justify-content-center">
            <div className="col-lg-3 col-md-6 d-flex align-items-stretch">
              <div className="team-member w-100">
                <div className="member-img position-relative overflow-hidden rounded-3">
                  <img src="/assets/img/doctors/doctors-1.jpg" className="img-fluid w-100" alt="Team Member 1" />
                  <div className="social">
                    <a href="https://github.com"><i className="bi bi-github"></i></a>
                    <a href="https://linkedin.com"><i className="bi bi-linkedin"></i></a>
                  </div>
                </div>
                <div className="member-info mt-3">
                  <h4>Team Member 1</h4>
                  <span>Project Lead & ML Engineer</span>
                </div>
              </div>
            </div>
            <div className="col-lg-3 col-md-6 d-flex align-items-stretch">
              <div className="team-member w-100">
                <div className="member-img position-relative overflow-hidden rounded-3">
                  <img src="/assets/img/doctors/doctors-2.jpg" className="img-fluid w-100" alt="Team Member 2" />
                  <div className="social">
                    <a href="https://github.com"><i className="bi bi-github"></i></a>
                    <a href="https://linkedin.com"><i className="bi bi-linkedin"></i></a>
                  </div>
                </div>
                <div className="member-info mt-3">
                  <h4>Team Member 2</h4>
                  <span>Frontend Developer</span>
                </div>
              </div>
            </div>
            <div className="col-lg-3 col-md-6 d-flex align-items-stretch">
              <div className="team-member w-100">
                <div className="member-img position-relative overflow-hidden rounded-3">
                  <img src="/assets/img/doctors/doctors-3.jpg" className="img-fluid w-100" alt="Team Member 3" />
                  <div className="social">
                    <a href="https://github.com"><i className="bi bi-github"></i></a>
                    <a href="https://linkedin.com"><i className="bi bi-linkedin"></i></a>
                  </div>
                </div>
                <div className="member-info mt-3">
                  <h4>Team Member 3</h4>
                  <span>Backend Developer</span>
                </div>
              </div>
            </div>
            <div className="col-lg-3 col-md-6 d-flex align-items-stretch">
              <div className="team-member w-100">
                <div className="member-img position-relative overflow-hidden rounded-3">
                  <img src="/assets/img/doctors/doctors-4.jpg" className="img-fluid w-100" alt="Team Member 4" />
                  <div className="social">
                    <a href="https://github.com"><i className="bi bi-github"></i></a>
                    <a href="https://linkedin.com"><i className="bi bi-linkedin"></i></a>
                  </div>
                </div>
                <div className="member-info mt-3">
                  <h4>Team Member 4</h4>
                  <span>Data Scientist</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="faq section">
        <div className="container section-title">
          <h2>Frequently Asked Questions</h2>
          <p>Learn more about DermaScan and Melanoma.</p>
        </div>
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-lg-10">
              <div className="faq-container">
                {faqs.map((faq, idx) => (
                  <div key={idx} className={`faq-item ${idx === activeFaq ? 'faq-active' : ''}`} style={{ transition: 'all 0.3s' }}>
                    <h3 onClick={() => toggleFaq(idx)} style={{ cursor: 'pointer' }} className="d-flex justify-content-between align-items-center w-100">
                      <span>{faq.q}</span>
                      <i className={`bi ${idx === activeFaq ? 'bi-chevron-down text-primary' : 'bi-chevron-right text-muted'}`}></i>
                    </h3>
                    <div 
                      className="faq-content" 
                      style={{ 
                        maxHeight: idx === activeFaq ? '200px' : '0', 
                        overflow: 'hidden', 
                        transition: 'max-height 0.3s ease-in-out',
                        padding: idx === activeFaq ? '15px 0 0 0' : '0'
                      }}
                    >
                      <p className="text-secondary mb-0">{faq.a}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="contact section light-background">
        <div className="container section-title">
          <h2>Contact Us</h2>
          <p>Have questions about our project? Reach out to our team.</p>
        </div>
        <div className="container">
          <div className="row gy-4">
            <div className="col-lg-6">
              <div className="row gy-4">
                <div className="col-lg-12">
                  <div className="info-item d-flex flex-column justify-content-center align-items-center shadow-sm rounded-4 p-4 bg-white text-center">
                    <i className="bi bi-geo-alt fs-2 text-primary"></i>
                    <h3 className="mt-2 fs-6 fw-bold">University Campus</h3>
                    <p className="text-muted mb-0 small">Lab Two Classroom, Faculty of Computer Science</p>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="info-item d-flex flex-column justify-content-center align-items-center shadow-sm rounded-4 p-4 bg-white text-center">
                    <i className="bi bi-github fs-2 text-primary"></i>
                    <h3 className="mt-2 fs-6 fw-bold">GitHub</h3>
                    <p className="text-muted mb-0 small">github.com/dermascan-team</p>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="info-item d-flex flex-column justify-content-center align-items-center shadow-sm rounded-4 p-4 bg-white text-center">
                    <i className="bi bi-envelope fs-2 text-primary"></i>
                    <h3 className="mt-2 fs-6 fw-bold">Email Us</h3>
                    <p className="text-muted mb-0 small">project@dermascan.com</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-lg-6">
              <form 
                className="php-email-form bg-white shadow-sm p-4 rounded-4"
                onSubmit={(e) => { e.preventDefault(); alert('Message sent successfully!'); }}
              >
                <div className="row gy-3">
                  <div className="col-md-6">
                    <input type="text" className="form-control" placeholder="Your Name" required />
                  </div>
                  <div className="col-md-6">
                    <input type="email" className="form-control" placeholder="Your Email" required />
                  </div>
                  <div className="col-md-12">
                    <input type="text" className="form-control" placeholder="Subject" required />
                  </div>
                  <div className="col-md-12">
                    <textarea className="form-control" rows="4" placeholder="Message" required></textarea>
                  </div>
                  <div className="col-md-12 text-center mt-3">
                    <button type="submit" className="btn btn-primary text-white rounded-pill px-4 shadow-sm" style={{ background: '#3fbbc0', borderColor: '#3fbbc0' }}>
                      Send Message
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
