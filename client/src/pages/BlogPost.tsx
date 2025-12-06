import { useRoute } from "wouter";
import { SEO } from "@/components/SEO";
import { BLOG_POSTS_DATA } from "@/data/blogContent";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, ArrowLeft, Share2 } from "lucide-react";
import { useLocation } from "wouter";
import { NewsletterForm } from "@/components/NewsletterForm";

export default function BlogPost() {
  const [, params] = useRoute("/blog/:slug");
  const [, setLocation] = useLocation();
  
  const post = BLOG_POSTS_DATA.find(p => p.slug === params?.slug);

  if (!post) {
    return <div className="container mx-auto py-20 text-center">Article non trouvé</div>;
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <SEO 
        title={`${post.title} - Blog CryptoBot Pro`}
        description={post.excerpt}
      />

      {/* Hero Article */}
      <div className="relative h-[400px] w-full overflow-hidden">
        <div className="absolute inset-0 bg-black/50 z-10" />
        <img 
          src={post.image} 
          alt={post.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 z-20 flex items-center justify-center">
          <div className="container mx-auto px-4 text-center">
            <Badge className="mb-4 text-lg px-4 py-1">{post.category}</Badge>
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 max-w-4xl mx-auto leading-tight">
              {post.title}
            </h1>
            <div className="flex items-center justify-center gap-6 text-white/80">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5" /> {post.date}
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5" /> {post.readTime}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Contenu Principal */}
        <div className="lg:col-span-8">
          <Button variant="ghost" onClick={() => setLocation('/blog')} className="mb-8 pl-0 hover:pl-2 transition-all">
            <ArrowLeft className="mr-2 h-4 w-4" /> Retour au blog
          </Button>
          
          <div className="prose prose-invert prose-lg max-w-none">
            <div dangerouslySetInnerHTML={{ __html: post.content }} />
          </div>

          <div className="mt-12 pt-8 border-t border-border flex justify-between items-center">
            <p className="text-muted-foreground">Vous avez aimé cet article ?</p>
            <Button variant="outline" size="sm">
              <Share2 className="mr-2 h-4 w-4" /> Partager
            </Button>
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-4 space-y-8">
          <div className="bg-card border border-border rounded-xl p-6 sticky top-24">
            <h3 className="text-xl font-bold mb-4">Ne manquez aucune opportunité</h3>
            <p className="text-muted-foreground mb-6">
              Rejoignez 1,200+ traders qui reçoivent nos signaux et analyses chaque semaine.
            </p>
            <NewsletterForm />
          </div>
        </div>
      </div>
    </div>
  );
}
