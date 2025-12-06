import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, ArrowRight } from "lucide-react";
import { useLocation } from "wouter";
import { SEO } from "@/components/SEO";
import { BLOG_POSTS_DATA } from "@/data/blogContent";

export default function BlogList() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-background pb-20">
      <SEO 
        title="Blog Crypto Trading & Automatisation - CryptoBot Pro"
        description="Articles, tutoriels et analyses sur le trading crypto automatisé, l'intelligence artificielle et les stratégies d'investissement."
      />

      {/* Header Blog */}
      <div className="bg-card border-b border-border py-16">
        <div className="container mx-auto px-4 text-center">
          <Badge variant="secondary" className="mb-4">Blog & Ressources</Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
            L'Académie du Trader 2.0
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Tout ce dont vous avez besoin pour comprendre le trading algorithmique et maximiser vos profits avec l'IA.
          </p>
        </div>
      </div>

      {/* Liste des Articles */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {BLOG_POSTS_DATA.map((post) => (
            <Card key={post.id} className="group overflow-hidden border-border hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 bg-card">
              <div className="aspect-video overflow-hidden relative">
                <img 
                  src={post.image} 
                  alt={post.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <Badge className="absolute top-4 left-4 bg-background/80 backdrop-blur-sm text-foreground hover:bg-background">
                  {post.category}
                </Badge>
              </div>
              <CardHeader>
                <div className="flex items-center gap-4 text-xs text-muted-foreground mb-2">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" /> {post.date}
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" /> {post.readTime}
                  </div>
                </div>
                <CardTitle className="text-xl leading-tight group-hover:text-primary transition-colors">
                  {post.title}
                </CardTitle>
                <CardDescription className="line-clamp-3 mt-2">
                  {post.excerpt}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  variant="ghost" 
                  className="w-full group-hover:bg-primary/10 group-hover:text-primary justify-between"
                  onClick={() => setLocation(`/blog/${post.slug}`)}
                >
                  Lire l'article <ArrowRight className="h-4 w-4 ml-2 transition-transform group-hover:translate-x-1" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
