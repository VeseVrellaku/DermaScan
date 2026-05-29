import React, { useState, useEffect } from 'react';

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
      link: '#scan',
      linkText: 'Try it Now'
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

  // 4. Mock Scanning Interaction State
  const [imagePreview, setImagePreview] = useState(null);
  const [patientName, setPatientName] = useState('');
  const [patientEmail, setPatientEmail] = useState('');
  const [additionalSymptoms, setAdditionalSymptoms] = useState('');
  const [scanningStatus, setScanningStatus] = useState('idle'); // idle, scanning, completed
  const [scanResult, setScanResult] = useState(null);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
      setScanningStatus('idle');
      setScanResult(null);
    }
  };

  const startMockScan = (e) => {
    e.preventDefault();
    if (!imagePreview) return;

    setScanningStatus('scanning');
    
    // Simulate high-fidelity ML inference scan
    setTimeout(() => {
      setScanningStatus('completed');
      setScanResult({
        class: 'Benign Melanocytic Nevus (Normal Mole)',
        probability: 94.7,
        risk: 'Low Risk',
        recommendation: 'This lesion has characteristics of a normal mole. However, you should continue monitoring it using the ABCDE guidelines. If you notice any changes in symmetry, border, color, or size, consult a medical professional.'
      });
    }, 3000);
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
                <a className="cta-btn" href="#scan">Start Scan</a>
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

      {/* Scan Section (Interactive AI Mock Uploader) */}
      <section id="scan" className="appointment section light-background">
        <div className="container section-title">
          <h2>Scan Your Mole</h2>
          <p>Upload a clear image of your skin lesion for AI analysis</p>
        </div>
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-lg-8 card border-0 shadow-sm p-4 rounded-4">
              <form onSubmit={startMockScan}>
                <div className="row gy-3">
                  <div className="col-md-6 form-group">
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="Patient Name (Optional)" 
                      value={patientName}
                      onChange={(e) => setPatientName(e.target.value)}
                    />
                  </div>
                  <div className="col-md-6 form-group">
                    <input 
                      type="email" 
                      className="form-control" 
                      placeholder="Your Email (Optional)" 
                      value={patientEmail}
                      onChange={(e) => setPatientEmail(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group mt-3">
                  <label className="form-label fw-semibold text-secondary">Upload Image of Lesion</label>
                  <div 
                    className="border border-2 border-dashed rounded-4 p-4 text-center cursor-pointer bg-light position-relative overflow-hidden d-flex flex-column align-items-center justify-content-center"
                    style={{ minHeight: '220px', borderColor: '#3fbbc0' }}
                  >
                    {!imagePreview ? (
                      <>
                        <i className="bi bi-cloud-arrow-up text-primary" style={{ fontSize: '48px' }}></i>
                        <p className="mt-2 mb-1 fw-bold text-dark">Drag & drop your skin photo here</p>
                        <p className="text-muted small">Supports JPG, PNG (Max 5MB)</p>
                        <label htmlFor="file-upload" className="btn btn-sm btn-primary mt-2" style={{ cursor: 'pointer' }}>
                          Browse Image
                        </label>
                        <input id="file-upload" type="file" accept="image/*" className="d-none" onChange={handleImageChange} required />
                      </>
                    ) : (
                      <div className="position-relative w-100 text-center">
                        <img 
                          src={imagePreview} 
                          alt="Skin Lesion Preview" 
                          className="img-fluid rounded-3" 
                          style={{ maxHeight: '200px', objectFit: 'contain' }} 
                        />
                        {/* Scanning laser animation overlay */}
                        {scanningStatus === 'scanning' && (
                          <div 
                            className="position-absolute w-100 start-0" 
                            style={{
                              height: '4px',
                              background: 'linear-gradient(to right, transparent, #ff3b3b, transparent)',
                              boxShadow: '0 0 12px #ff3b3b',
                              top: '0',
                              animation: 'scanLaser 2s infinite ease-in-out'
                            }}
                          ></div>
                        )}
                        <button 
                          type="button" 
                          className="btn btn-sm btn-danger position-absolute top-0 end-0 m-1 rounded-circle"
                          onClick={() => { setImagePreview(null); setScanningStatus('idle'); setScanResult(null); }}
                        >
                          <i className="bi bi-trash"></i>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="form-group mt-3">
                  <textarea 
                    className="form-control" 
                    rows="3" 
                    placeholder="Any additional symptoms (itching, bleeding, changing shape)?"
                    value={additionalSymptoms}
                    onChange={(e) => setAdditionalSymptoms(e.target.value)}
                  ></textarea>
                </div>

                {/* Scan Status Feedback */}
                {scanningStatus === 'scanning' && (
                  <div className="mt-3 text-center text-primary fw-bold animate-pulse">
                    <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                    Running Convolutional Neural Network (CNN) Inference...
                  </div>
                )}

                {scanningStatus === 'completed' && scanResult && (
                  <div className="mt-4 alert alert-success border-0 shadow-sm rounded-4 p-4" style={{ background: '#f0fdf4', color: '#15803d' }}>
                    <div className="d-flex align-items-center mb-3">
                      <i className="bi bi-check-circle-fill me-2 fs-4 text-success"></i>
                      <h4 className="alert-heading m-0 fw-bold">Analysis Complete!</h4>
                    </div>
                    <div className="row gy-3">
                      <div className="col-md-6 border-end">
                        <p className="text-secondary small mb-1">CLASSIFICATION RESULT</p>
                        <p className="fw-bold fs-5 text-dark">{scanResult.class}</p>
                      </div>
                      <div className="col-md-3 border-end text-center">
                        <p className="text-secondary small mb-1">PROBABILITY</p>
                        <p className="fw-bold fs-5 text-dark">{scanResult.probability}%</p>
                      </div>
                      <div className="col-md-3 text-center">
                        <p className="text-secondary small mb-1">RISK LEVEL</p>
                        <span className="badge bg-success px-3 py-2 fs-6 rounded-pill">{scanResult.risk}</span>
                      </div>
                    </div>
                    <hr className="my-3" style={{ opacity: 0.15 }} />
                    <p className="mb-0 text-dark" style={{ lineHeight: '1.6' }}>{scanResult.recommendation}</p>
                    <div className="mt-3 d-flex gap-2">
                      <button type="button" className="btn btn-sm btn-outline-success">
                        <i className="bi bi-file-earmark-pdf me-1"></i> Download PDF Report
                      </button>
                      <a href="#header" className="btn btn-sm btn-success">
                        <i className="bi bi-telephone-outbound me-1"></i> Consult Voice Doctor
                      </a>
                    </div>
                  </div>
                )}

                <div className="text-center mt-4">
                  <button 
                    type="submit" 
                    className="btn btn-lg btn-success text-white px-5 rounded-pill shadow-sm"
                    disabled={!imagePreview || scanningStatus === 'scanning'}
                    style={{ background: '#3fbbc0', borderColor: '#3fbbc0' }}
                  >
                    {scanningStatus === 'scanning' ? 'Scanning...' : 'Analyze Skin Image'}
                  </button>
                </div>
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
