import React, { useMemo } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import { SEOHead } from '@/components/SEOHead';
import { blogPosts } from '@/data/blogPosts';
import { ChevronRight, Calendar, Clock, ArrowLeft, ShieldAlert, Linkedin } from 'lucide-react';

const BlogPost = () => {
  const { slug } = useParams<{ slug: string }>();
  
  const post = useMemo(() => blogPosts.find(p => p.slug === slug), [slug]);

  if (!post) {
    return <Navigate to="/404" />;
  }

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    datePublished: post.publishedAt,
    dateModified: post.publishedAt,
    author: { "@type": "Person", "name": "Priyodip" },
    publisher: { "@type": "Organization", "name": "PipFactor", "url": import.meta.env.VITE_PUBLIC_APP_URL },
    image: `https://cdn.pipfactor.com/website-assets/og-image.png`,
    mainEntityOfPage: `${import.meta.env.VITE_PUBLIC_APP_URL}/blog/${post.slug}`
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: import.meta.env.VITE_PUBLIC_APP_URL },
      { "@type": "ListItem", position: 2, name: "Blog", item: `${import.meta.env.VITE_PUBLIC_APP_URL}/blog` },
      { "@type": "ListItem", position: 3, name: post.title, item: `${import.meta.env.VITE_PUBLIC_APP_URL}/blog/${post.slug}` }
    ]
  };

  return (
    <div className="circuit-bg relative overflow-hidden min-h-screen text-white pb-24">
      <div className="relative z-10">
        <SEOHead 
        title={`${post.title} | PipFactor Blog`}
        description={post.excerpt}
        canonical={`${import.meta.env.VITE_PUBLIC_APP_URL}/blog/${post.slug}`}
        structuredData={[articleSchema, breadcrumbSchema]}
      />

      {/* Hero Header Section */}
      <section className="relative pt-32 pb-16 px-4">
        <div className="absolute inset-0 z-0 pointer-events-none" style={{
          background: "radial-gradient(circle at 50% -20%, rgba(200, 147, 90, 0.1), transparent 70%)"
        }} />
        <div className="container mx-auto max-w-4xl relative z-10">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-xs uppercase tracking-widest text-[#9CA3AF] mb-8">
            <Link to="/" className="hover:text-white transition-colors">Home</Link>
            <ChevronRight size={12} className="text-[#C8935A]" />
            <Link to="/blog" className="hover:text-white transition-colors">Blog</Link>
            <ChevronRight size={12} className="text-[#C8935A]" />
            <span className="text-[#E2B485] truncate">{post.title}</span>
          </nav>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-white mb-8 leading-tight">
            {post.title}
          </h1>

          <div className="flex flex-wrap items-center gap-6 text-[#9CA3AF] text-sm border-b border-[#C8935A]/10 pb-8">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[#C8935A]/20 flex items-center justify-center border border-[#C8935A]/30 text-[#E2B485] font-bold text-xs">P</div>
              <span className="text-white font-medium">Priyodip</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar size={16} className="text-[#C8935A]" />
              {new Date(post.publishedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </div>
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-[#C8935A]" />
              {post.readTimeMinutes} min read
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 max-w-4xl">
        {/* Article Body */}
        <div className="bg-[#111315]/40 backdrop-blur-sm border border-[#C8935A]/10 rounded-3xl p-6 md:p-12 shadow-2xl relative">
          <article className="prose prose-invert prose-lg max-w-none">
            <ReactMarkdown rehypePlugins={[rehypeRaw]}>
              {post.content}
            </ReactMarkdown>
          </article>
        </div>

        {/* Founder Bio Footer - E-E-A-T */}
        <section className="mt-16 py-12 px-8 bg-[#111315]/60 border border-[#C8935A]/10 rounded-3xl">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
            <div className="w-20 h-20 rounded-full bg-[#C8935A]/20 flex items-center justify-center shrink-0 border border-[#C8935A]/30">
              <span className="text-[#E2B485] font-bold text-2xl">P</span>
            </div>
            <div className="text-center md:text-left">
              <h4 className="text-xl font-bold text-white mb-1">About the Author</h4>
              <p className="text-sm text-[#C8935A] mb-4 uppercase tracking-wider">Priyodip — Founder & Lead Engineer</p>
              <p className="text-[#9CA3AF] leading-relaxed mb-4">
                A trader-turned-engineer based in Bangalore, India. PipFactor is the product of years spent navigating retail Forex and commodities markets, combined with a passion for building systematic, data-driven software solutions.
              </p>
              <a 
                href="https://www.linkedin.com/in/priyodip-mukhopadhyay-13o4" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-[#C8935A] hover:text-[#E2B485] transition-colors font-medium text-sm"
              >
                <Linkedin size={16} />
                Connect on LinkedIn
              </a>
            </div>
          </div>
        </section>

        {/* Footer CTA */}
        <div className="mt-20 py-16 px-4 text-center relative overflow-hidden rounded-3xl border border-[#C8935A]/20 bg-gradient-to-b from-[#111315] to-black">
          <div className="absolute inset-0 z-0 opacity-10 pointer-events-none bg-[url('https://cdn.pipfactor.com/website-assets/circuit.svg')] bg-repeat" />
          <div className="relative z-10">
            <h3 className="text-3xl font-display font-bold text-white mb-4">Ready to upgrade your trading?</h3>
            <p className="text-lg text-[#9CA3AF] mb-8 max-w-xl mx-auto">Join the PipFactor community and get access to AI-powered market intelligence that actually matters.</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/pricing" className="inline-flex items-center justify-center h-14 px-10 rounded-full bg-[#C8935A] text-black font-bold hover:bg-[#E2B485] transition-all shadow-xl shadow-[#C8935A]/10 scale-105 hover:scale-110 active:scale-95">
                Start 7-Day Free Trial
              </Link>
              <Link to="/blog" className="inline-flex items-center gap-2 text-white hover:text-[#E2B485] transition-colors font-medium">
                <ArrowLeft size={18} /> Explore more insights
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-12 text-center">
          <p className="inline-flex items-center gap-2 text-xs text-[#9CA3AF]/60 bg-[#111315]/40 px-4 py-2 rounded-full border border-[#C8935A]/10">
            <ShieldAlert size={14} className="text-[#C8935A]/60" />
            Analysis provided for educational purposes only.
          </p>
        </div>
      </div>
      </div>
    </div>
  );
};

export default BlogPost;
