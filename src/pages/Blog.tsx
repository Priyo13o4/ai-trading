import React from 'react';
import { Link } from 'react-router-dom';
import { SEOHead } from '@/components/SEOHead';
import { blogPosts } from '@/data/blogPosts';
import { Calendar, Clock, ArrowRight } from 'lucide-react';

const Blog = () => {
  return (
    <div className="circuit-bg relative overflow-hidden min-h-screen text-white pt-24 pb-16">
      <div className="relative z-10">
        <SEOHead 
        title="Blog — AI Trading Strategies & Market Analysis | PipFactor"
        description="Research, analysis, and guides from the PipFactor team on AI trading, market regimes, and more."
        canonical="https://pipfactor.com/blog"
      />
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-display font-bold text-[#E0E0E0] mb-4">
            Market Intelligence & Trading Insights
          </h1>
          <p className="text-lg text-[#9CA3AF] max-w-2xl mx-auto">
            Real analysis, honest breakdowns, and the thinking behind PipFactor — from the trader who built it.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {blogPosts.map((post) => (
            <div key={post.slug} className="lumina-card p-6 md:p-8 rounded-2xl flex flex-col h-full border border-[#C8935A]/20 bg-[#111315]/80 hover:bg-[#C8935A]/5 transition-all shadow-lg group">
              <div className="flex items-center gap-4 text-xs font-medium text-[#9CA3AF] mb-4">
                <div className="flex items-center gap-1">
                  <Calendar size={14} className="text-[#C8935A]" />
                  {new Date(post.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </div>
                <div className="flex items-center gap-1">
                  <Clock size={14} className="text-[#C8935A]" />
                  {post.readTimeMinutes} min read
                </div>
              </div>
              
              <h2 className="text-2xl font-bold text-white mb-4 group-hover:text-[#E2B485] transition-colors">
                <Link to={`/blog/${post.slug}`} className="focus:outline-none">
                  {post.title}
                </Link>
              </h2>
              
              <p className="text-[#9CA3AF] mb-8 line-clamp-3 flex-grow">
                {post.excerpt}
              </p>
              
              <div className="mt-auto">
                <Link to={`/blog/${post.slug}`} className="inline-flex items-center gap-2 text-[#E2B485] hover:text-white transition-colors font-medium text-sm uppercase tracking-wider">
                  Read Article <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);
};

export default Blog;
