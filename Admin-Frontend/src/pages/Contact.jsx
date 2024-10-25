import React, { useState } from "react";
import { FaPhone, FaEnvelope, FaMapMarkerAlt } from "react-icons/fa";
import { toast } from "react-toastify";

function Contact() {
  const [activeTab, setActiveTab] = useState("contact");

  const renderTabContent = () => {
    switch (activeTab) {
      case "contact":
        return <ContactForm />;
      case "query":
        return <QueryTab />;
      case "faq":
        return <FAQTab />;
      default:
        return null;
    }
  };

  return (
    <div className="w-full flex flex-col">
      <h1 className="text-3xl font-semibold text-primary tracking-widest mb-5">Contact Us</h1>

      <div className="flex space-x-4 ml-2">
        <TabButton
          label="Contact"
          active={activeTab === "contact"}
          onClick={() => setActiveTab("contact")}
        />
        <TabButton
          label="Query"
          active={activeTab === "query"}
          onClick={() => setActiveTab("query")}
        />
        <TabButton
          label="FAQ"
          active={activeTab === "faq"}
          onClick={() => setActiveTab("faq")}
        />
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        <div className="w-full md:w-2/3 bg-background dark:bg-gray-800 rounded-lg shadow-md p-6">
          {renderTabContent()}
        </div>
        <div className="w-full md:w-1/3 bg-background dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4 text-primary">
            Contact Information
          </h2>
          <ContactInfo />
        </div>
      </div>
    </div>
  );
}

const TabButton = ({ label, active, onClick }) => (
  <button
    className={`px-4 py-2 rounded-t-lg font-medium ${
      active
        ? "bg-primary text-white"
        : "bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-800 dark:text-white"
    }`}
    onClick={onClick}
  >
    {label}
  </button>
);

const ContactForm = () => (
  <div className="">
    <h2 className="text-xl font-semibold mb-4 text-primary">Get Into Touch</h2>
    <form className="space-y-4">
      <input
        type="text"
        placeholder="Name"
        required
       className="w-full p-2 border rounded focus:outline-primary dark:bg-gray-700 bg-gray-100 text-secondary-foreground"
      />
      <input
        type="email"
        placeholder="Email"
        required
       className="w-full p-2 border rounded focus:outline-primary dark:bg-gray-700 bg-gray-100 text-secondary-foreground"
      />
      <textarea
        placeholder="Message"
        rows="4"
        required
       className="w-full p-2 border rounded focus:outline-primary dark:bg-gray-700 bg-gray-100 text-secondary-foreground"
      ></textarea>
      <button
        type="submit"
        onClick={(e) => {
          e.preventDefault();
          toast.success("Message sent successfully!");
        }}
        className="bg-primary text-white px-4 py-2 rounded hover:bg-secondary"
      >
        Send Message
      </button>
    </form>
  </div>
);

const QueryTab = () => (
  <div>
    <h2 className="text-xl font-semibold mb-4 text-primary">Ask a Query</h2>
    <form className="space-y-4">
      <input
        type="text"
        placeholder="Subject"
        required
        className="w-full p-2 border rounded focus:outline-primary dark:bg-gray-700 bg-gray-100 text-secondary-foreground"
      />
      <textarea
        placeholder="Your query"
        rows="4"
        required
        className="w-full p-2 border rounded focus:outline-primary dark:bg-gray-700 bg-gray-100 text-secondary-foreground"
      ></textarea>
      <button
        type="submit"
        onClick={(e) => {
          e.preventDefault();
          toast.success("Query submitted successfully!");
        }}
        className="bg-primary text-white px-4 py-2 rounded hover:bg-secondary"
      >
        Submit Query
      </button>
    </form>
  </div>
);

const FAQTab = () => (
  <div>
    <h2 className="text-xl font-semibold mb-4 text-primary">
      Frequently Asked Questions
    </h2>
    <div className="space-y-4">
      <FAQItem
        question="How can I reset my password?"
        answer="You can reset your password by clicking on the 'Forgot Password' link on the login page and following the instructions sent to your email."
      />
      <FAQItem
        question="What are the business hours?"
        answer="Our business hours are Monday to Friday, 9 AM to 5 PM EST."
      />
      <FAQItem
        question="How long does it take to process a refund?"
        answer="Refunds are typically processed within 3-5 business days, depending on your bank."
      />
    </div>
  </div>
);

const FAQItem = ({ question, answer }) => (
  <div className="border-b pb-2">
    <h3 className="font-medium text-primary">{question}</h3>
    <p className="text-gray-600 dark:text-white mt-1">{answer}</p>
  </div>
);

const ContactInfo = () => (
  <div className="space-y-4">
    <div className="flex items-center">
      <FaPhone className="text-primary mr-2" />
      <span className="text-secondary-foreground">+1 (555) 123-4567</span>
    </div>
    <div className="flex items-center">
      <FaEnvelope className="text-primary mr-2" />
      <span className="text-secondary-foreground">support@example.com</span>
    </div>
    <div className="flex items-center">
      <FaMapMarkerAlt className="text-primary mr-2" />
      <span className="text-secondary-foreground">123 Business St, City, State 12345</span>
    </div>
  </div>
);

export default Contact;
