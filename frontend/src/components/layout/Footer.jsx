import React from 'react';

export default function Footer() {
  return (
    <footer id="footer" className="footer">
      <div className="container footer-top">
        <div className="row gy-4">
          <div className="col-lg-4 col-md-6 footer-about">
            <a href="/" className="logo d-flex align-items-center">
              <span className="sitename">DermaScan</span>
            </a>
            <div className="footer-contact pt-3">
              <p>Faculty of Computer Science</p>
              <p>Lab Two Project</p>
              <p className="mt-3"><strong>Email:</strong> <span>project@dermascan.com</span></p>
            </div>
            <div className="social-links d-flex mt-4">
              <a href="https://github.com" target="_blank" rel="noopener noreferrer"><i className="bi bi-github"></i></a>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer"><i className="bi bi-linkedin"></i></a>
            </div>
          </div>

          <div className="col-lg-2 col-md-3 footer-links">
            <h4>Useful Links</h4>
            <ul>
              <li><a href="/#hero">Home</a></li>
              <li><a href="/#about">About Project</a></li>
              <li><a href="/#how-it-works">How It Works</a></li>
              <li><a href="/#team">Team</a></li>
              <li><a href="/#faq">FAQ</a></li>
            </ul>
          </div>

          <div className="col-lg-2 col-md-3 footer-links">
            <h4>Features</h4>
            <ul>
              <li><a href="/#features">AI Detection</a></li>
              <li><a href="/#features">Image Analysis</a></li>
              <li><a href="/#features">Risk Assessment</a></li>
              <li><a href="/#abcde">ABCDE Rule Guide</a></li>
            </ul>
          </div>
        </div>
      </div>

      <div className="container copyright text-center mt-4">
        <p>© <span>Copyright</span> <strong className="px-1 sitename">DermaScan</strong> <span>All Rights Reserved</span></p>
        <div className="credits">
          Designed by the DermaScan Team for Lab Two. Template based on <a href="https://bootstrapmade.com/" target="_blank" rel="noopener noreferrer">BootstrapMade</a>.
        </div>
      </div>
    </footer>
  );
}
