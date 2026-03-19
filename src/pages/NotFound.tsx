import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { SEOHead } from "@/components/SEOHead";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      {/* noindex prevents Googlebot from indexing this 404 page as real content */}
      <SEOHead
        title="Page Not Found"
        description="The page you are looking for doesn't exist."
        canonical={`https://pipfactor.com${location.pathname}`}
        noIndex
      />
      <div className="text-center">
        <span className="block text-4xl font-bold mb-2 text-gray-400" aria-hidden="true">
          404
        </span>
        <h1 className="text-2xl font-bold mb-4">Page Not Found</h1>
        <p className="text-xl text-gray-600 mb-4">
          The page you are looking for doesn&apos;t exist or has been moved.
        </p>
        <a href="/" className="text-blue-500 hover:text-blue-700 underline">
          Return to Home
        </a>
      </div>
    </div>
  );
};

export default NotFound;
