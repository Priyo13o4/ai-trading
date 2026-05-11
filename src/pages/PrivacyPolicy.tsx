import React from 'react';
import { SEOHead } from '@/components/SEOHead';

const PrivacyPolicy = () => {
  return (
    <div className="circuit-bg relative overflow-hidden min-h-screen text-white pt-24 pb-16">
      <div className="relative z-10">
        <SEOHead 
          title="Privacy Policy | PipFactor"
          description="Privacy Policy for PipFactor. Learn how we handle your personal information."
          canonical="https://pipfactor.com/privacy-policy"
        />
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="bg-[#1a1d21] border border-[#C8935A]/20 p-8 md:p-12 rounded-2xl shadow-xl">
            <div className="flex items-center gap-6 mb-8">
              <div className="h-16 w-16 shrink-0">
                <img 
                  src="https://cdn.pipfactor.com/website-assets/pipfactor.svg" 
                  alt="PipFactor" 
                  className="h-full w-full object-contain"
                  style={{ filter: 'brightness(0) saturate(100%) invert(86%) sepia(21%) saturate(940%) hue-rotate(338deg) brightness(88%) contrast(92%)' }} 
                />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">Privacy Policy</h1>
                <p className="text-[#9CA3AF]">Last updated May 09, 2026</p>
              </div>
            </div>
            
            <div className="prose prose-invert max-w-none text-[#9CA3AF] space-y-6">
              <p>
                This Privacy Notice for <strong>PipFactor</strong> ('<strong>we</strong>', '<strong>us</strong>', or '<strong>our</strong>'), 
                describes how and why we might access, collect, store, use, and/or share ('<strong>process</strong>') your personal information 
                when you use our services ('<strong>Services</strong>'), including when you:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Visit our website at <a className="text-[#E2B485] hover:underline" href="https://pipfactor.com">https://pipfactor.com</a> or any website of ours that links to this Privacy Notice</li>
                <li>Use <strong>PipFactor</strong>. PipFactor is a SaaS platform that provides trading signals, trading strategies, and financial news analysis to help traders make informed decisions.</li>
                <li>Engage with us in other related ways, including any marketing or events</li>
              </ul>

              <p>
                <strong>Questions or concerns?</strong> Reading this Privacy Notice will help you understand your privacy rights and choices. 
                If you do not agree with our policies and practices, please do not use our Services. If you still have any questions or concerns, 
                please contact us at <a className="text-[#E2B485] hover:underline" href="mailto:support@pipfactor.com">support@pipfactor.com</a>.
              </p>

              <h2 className="text-xl text-[#E2B485] mt-8 mb-4 font-semibold">SUMMARY OF KEY POINTS</h2>
              <p>
                This summary provides key points from our Privacy Notice. You can find more details about any of these topics by using our table of contents below.
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>What personal information do we process?</strong> When you visit, use, or navigate our Services, we may process personal information depending on how you interact with us and the Services.</li>
                <li><strong>Do we process any sensitive personal information?</strong> We do not process sensitive personal information.</li>
                <li><strong>Do we collect any information from third parties?</strong> We do not collect any information from third parties.</li>
                <li><strong>How do we process your information?</strong> We process your information to provide, improve, and administer our Services, communicate with you, for security and fraud prevention, and to comply with law.</li>
              </ul>

              <h2 className="text-xl text-[#E2B485] mt-8 mb-4 font-semibold">TABLE OF CONTENTS</h2>
              <ol className="list-decimal pl-6 space-y-2">
                <li><a className="text-[#E2B485] hover:underline" href="#infocollect">WHAT INFORMATION DO WE COLLECT?</a></li>
                <li><a className="text-[#E2B485] hover:underline" href="#infouse">HOW DO WE PROCESS YOUR INFORMATION?</a></li>
                <li><a className="text-[#E2B485] hover:underline" href="#legalbases">WHAT LEGAL BASES DO WE RELY ON TO PROCESS YOUR PERSONAL INFORMATION?</a></li>
                <li><a className="text-[#E2B485] hover:underline" href="#whoshare">WHEN AND WITH WHOM DO WE SHARE YOUR PERSONAL INFORMATION?</a></li>
                <li><a className="text-[#E2B485] hover:underline" href="#cookies">DO WE USE COOKIES AND OTHER TRACKING TECHNOLOGIES?</a></li>
                <li><a className="text-[#E2B485] hover:underline" href="#ai">DO WE OFFER ARTIFICIAL INTELLIGENCE-BASED PRODUCTS?</a></li>
                <li><a className="text-[#E2B485] hover:underline" href="#intltransfers">IS YOUR INFORMATION TRANSFERRED INTERNATIONALLY?</a></li>
                <li><a className="text-[#E2B485] hover:underline" href="#inforetain">HOW LONG DO WE KEEP YOUR INFORMATION?</a></li>
                <li><a className="text-[#E2B485] hover:underline" href="#infosafe">HOW DO WE KEEP YOUR INFORMATION SAFE?</a></li>
                <li><a className="text-[#E2B485] hover:underline" href="#infominors">DO WE COLLECT INFORMATION FROM MINORS?</a></li>
                <li><a className="text-[#E2B485] hover:underline" href="#privacyrights">WHAT ARE YOUR PRIVACY RIGHTS?</a></li>
                <li><a className="text-[#E2B485] hover:underline" href="#DNT">CONTROLS FOR DO-NOT-TRACK FEATURES</a></li>
                <li><a className="text-[#E2B485] hover:underline" href="#uslaws">DO UNITED STATES RESIDENTS HAVE SPECIFIC PRIVACY RIGHTS?</a></li>
                <li><a className="text-[#E2B485] hover:underline" href="#policyupdates">DO WE MAKE UPDATES TO THIS NOTICE?</a></li>
                <li><a className="text-[#E2B485] hover:underline" href="#contact">HOW CAN YOU CONTACT US ABOUT THIS NOTICE?</a></li>
                <li><a className="text-[#E2B485] hover:underline" href="#request">HOW CAN YOU REVIEW, UPDATE, OR DELETE THE DATA WE COLLECT FROM YOU?</a></li>
              </ol>

              <h2 id="infocollect" className="text-xl text-[#E2B485] mt-8 mb-4 font-semibold">1. WHAT INFORMATION DO WE COLLECT?</h2>
              <h3 className="text-lg text-[#E2B485] mt-6 mb-3 font-semibold">Personal information you disclose to us</h3>
              <p>We collect personal information that you voluntarily provide to us when you register on the Services, express an interest in obtaining information about us or our products and Services, or otherwise when you contact us.</p>
              <p><strong>Personal Information Provided by You.</strong> The personal information we collect may include names, email addresses, usernames, passwords, and contact or authentication data.</p>
              <p><strong>Payment Data.</strong> We may collect data necessary to process your payment if you choose to make purchases. All payment data is handled and stored by <strong>Razorpay</strong> and <strong>Plisio</strong>. You may find their privacy notice link(s) here: <a className="text-[#E2B485] hover:underline" href="https://razorpay.com/privacy/">https://razorpay.com/privacy/</a> and <a className="text-[#E2B485] hover:underline" href="https://plisio.net/docs/plisio-privacy-policy.pdf">https://plisio.net/docs/plisio-privacy-policy.pdf</a>.</p>

              <h3 className="text-lg text-[#E2B485] mt-6 mb-3 font-semibold">Information automatically collected</h3>
              <p>Some information — such as your Internet Protocol (IP) address and/or browser and device characteristics — is collected automatically when you visit our Services.</p>
              <p>Like many businesses, we also collect information through cookies and similar technologies. You can find out more about this in our Cookie Notice: <a className="text-[#E2B485] hover:underline" href="https://pipfactor.com/cookie-policy">https://pipfactor.com/cookie-policy</a>.</p>

              <h2 id="infouse" className="text-xl text-[#E2B485] mt-8 mb-4 font-semibold">2. HOW DO WE PROCESS YOUR INFORMATION?</h2>
              <p>We process your information to provide, improve, and administer our Services, communicate with you, for security and fraud prevention, and to comply with law. We may also process your information for other purposes only with your prior explicit consent.</p>

              <h2 id="legalbases" className="text-xl text-[#E2B485] mt-8 mb-4 font-semibold">3. WHAT LEGAL BASES DO WE RELY ON TO PROCESS YOUR PERSONAL INFORMATION?</h2>
              <p>We only process your personal information when we believe it is necessary and we have a valid legal reason (i.e., legal basis) to do so under applicable law, like with your consent, to comply with laws, to provide you with services to enter into or fulfil our contractual obligations, to protect your rights, or to fulfil our legitimate business interests.</p>

              <h2 id="whoshare" className="text-xl text-[#E2B485] mt-8 mb-4 font-semibold">4. WHEN AND WITH WHOM DO WE SHARE YOUR PERSONAL INFORMATION?</h2>
              <p>We may share information in specific situations described in this section and/or with the following third parties: <strong>Razorpay</strong>, <strong>Plisio</strong>, and <strong>Google Analytics</strong>.</p>

              <h2 id="cookies" className="text-xl text-[#E2B485] mt-8 mb-4 font-semibold">5. DO WE USE COOKIES AND OTHER TRACKING TECHNOLOGIES?</h2>
              <p>We may use cookies and similar tracking technologies (like web beacons and pixels) to access or store information. Specific information about how we use such technologies and how you can refuse certain cookies is set out in our Cookie Notice.</p>

              <h2 id="ai" className="text-xl text-[#E2B485] mt-8 mb-4 font-semibold">6. DO WE OFFER ARTIFICIAL INTELLIGENCE-BASED PRODUCTS?</h2>
              <p>Yes, we offer products that utilize AI technology to provide trading insights and signals. We process data to improve these models and provide you with better insights.</p>

              <h2 id="intltransfers" className="text-xl text-[#E2B485] mt-8 mb-4 font-semibold">7. IS YOUR INFORMATION TRANSFERRED INTERNATIONALLY?</h2>
              <p>Our servers are located in India. If you are accessing our Services from outside India, please be aware that your information may be transferred to, stored, and processed by us in our facilities and by those third parties with whom we may share your personal information.</p>

              <h2 id="inforetain" className="text-xl text-[#E2B485] mt-8 mb-4 font-semibold">8. HOW LONG DO WE KEEP YOUR INFORMATION?</h2>
              <p>We will only keep your personal information for as long as it is necessary for the purposes set out in this Privacy Notice, unless a longer retention period is required or permitted by law (such as tax, accounting, or other legal requirements).</p>

              <h2 id="infosafe" className="text-xl text-[#E2B485] mt-8 mb-4 font-semibold">9. HOW DO WE KEEP YOUR INFORMATION SAFE?</h2>
              <p>We have implemented appropriate and reasonable technical and organisational security measures designed to protect the security of any personal information we process. However, despite our safeguards and efforts to secure your information, no electronic transmission over the Internet or information storage technology can be guaranteed to be 100% secure.</p>

              <h2 id="infominors" className="text-xl text-[#E2B485] mt-8 mb-4 font-semibold">10. DO WE COLLECT INFORMATION FROM MINORS?</h2>
              <p>We do not knowingly solicit data from or market to children under 18 years of age. By using the Services, you represent that you are at least 18.</p>

              <h2 id="privacyrights" className="text-xl text-[#E2B485] mt-8 mb-4 font-semibold">11. WHAT ARE YOUR PRIVACY RIGHTS?</h2>
              <p>In some regions (like the EEA, UK, and Canada), you have certain rights under applicable data protection laws. These may include the right (i) to request access and obtain a copy of your personal information, (ii) to request rectification or erasure; (iii) to restrict the processing of your personal information; and (iv) if applicable, to data portability. In certain circumstances, you may also have the right to object to the processing of your personal information.</p>

              <h2 id="DNT" className="text-xl text-[#E2B485] mt-8 mb-4 font-semibold">12. CONTROLS FOR DO-NOT-TRACK FEATURES</h2>
              <p>Most web browsers and some mobile operating systems and mobile applications include a Do-Not-Track ("DNT") feature or setting you can activate to signal your privacy preference not to have data about your online browsing activities monitored and collected. At this stage, no uniform technology standard for recognising and implementing DNT signals has been finalised.</p>

              <h2 id="uslaws" className="text-xl text-[#E2B485] mt-8 mb-4 font-semibold">13. DO UNITED STATES RESIDENTS HAVE SPECIFIC PRIVACY RIGHTS?</h2>
              <p>If you are a resident of California, Colorado, Connecticut, Virginia or Utah, you are granted specific rights regarding access to your personal information. Please contact us for more information regarding your specific state's laws.</p>

              <h2 id="policyupdates" className="text-xl text-[#E2B485] mt-8 mb-4 font-semibold">14. DO WE MAKE UPDATES TO THIS NOTICE?</h2>
              <p>We may update this Privacy Notice from time to time. The updated version will be indicated by an updated "Revised" date and the updated version will be effective as soon as it is accessible.</p>

              <h2 id="contact" className="text-xl text-[#E2B485] mt-8 mb-4 font-semibold">15. HOW CAN YOU CONTACT US ABOUT THIS NOTICE?</h2>
              <p>If you have questions or comments about this notice, you may email us at <a className="text-[#E2B485] hover:underline" href="mailto:support@pipfactor.com">support@pipfactor.com</a> or contact us by post at:</p>
              <p>
                <strong>PipFactor</strong><br />
                Bengaluru, Karnataka 560119<br />
                India
              </p>

              <h2 id="request" className="text-xl text-[#E2B485] mt-8 mb-4 font-semibold">16. HOW CAN YOU REVIEW, UPDATE, OR DELETE THE DATA WE COLLECT FROM YOU?</h2>
              <p>Based on the applicable laws of your country, you may have the right to request access to the personal information we collect from you, change that information, or delete it. To request to review, update, or delete your personal information, please submit a request to <a className="text-[#E2B485] hover:underline" href="mailto:support@pipfactor.com">support@pipfactor.com</a>.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
