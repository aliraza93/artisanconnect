import { useState, useEffect } from "react";
import { Layout } from "@/components/layout/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, Star, CheckCircle, Briefcase, Award, Map } from "lucide-react";
import { api, type ArtisanProfile } from "@/lib/api";
import { useLocation, useRoute } from "wouter";
import { useSEO } from "@/hooks/use-seo";
import { ArtisanReviewsList } from "@/components/review-dialog";
import { MapView } from "@/components/maps/map-view";
import { useAuth } from "@/lib/auth-context";

const CATEGORIES: Record<string, string> = {
  plumber: "Plumbing",
  electrician: "Electrical",
  carpenter: "Building & Renovation",
  painter: "Painting",
  hvac: "HVAC",
  welder: "Welding",
  architect: "Architecture",
  cctv: "CCTV & Security",
  automation: "Home Automation",
  solar: "Solar Installation",
  generators: "Generators",
  logistics: "Logistics & Transport",
  general: "General Handyman",
};

export default function ArtisanProfile() {
  const [, params] = useRoute("/artisan/:userId");
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const userId = params?.userId;
  const [profile, setProfile] = useState<(ArtisanProfile & { userName?: string }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState<string | null>(null);
  const [reviewCount, setReviewCount] = useState(0);

  const userName = profile?.userName || "Artisan";

  useSEO({
    title: profile ? `${userName} - Artisan Profile` : 'Artisan Profile',
    description: profile ? `View ${userName}'s artisan profile, skills, and reviews` : 'View artisan profile'
  });

  useEffect(() => {
    if (!userId) return;

    const fetchProfile = async () => {
      setLoading(true);
      try {
        const profileData = await api.getArtisanProfile(userId);
        setProfile(profileData);

        // Fetch reviews to get rating
        try {
          const reviews = await api.getUserReviews(userId);
          if (reviews.length > 0) {
            const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
            setRating(avgRating.toFixed(1));
            setReviewCount(reviews.length);
          }
        } catch (e) {
          console.error("Failed to fetch reviews:", e);
        }
      } catch (error) {
        console.error("Failed to fetch profile:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [userId]);

  if (loading) {
    return (
      <Layout>
        <div className="bg-slate-50 min-h-[calc(100vh-64px)] py-8">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <Card className="border-none shadow-sm">
              <CardContent className="p-8">
                <Skeleton className="h-8 w-1/2 mb-4" />
                <Skeleton className="h-4 w-3/4 mb-8" />
                <Skeleton className="h-32 w-full" />
              </CardContent>
            </Card>
          </div>
        </div>
      </Layout>
    );
  }

  if (!profile) {
    return (
      <Layout>
        <div className="bg-slate-50 min-h-[calc(100vh-64px)] py-8">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <Card className="border-none shadow-sm">
              <CardContent className="p-12 text-center">
                <p className="text-slate-500 text-lg">Artisan profile not found</p>
                <Button variant="outline" onClick={() => setLocation("/find-artisan")} className="mt-4">
                  Browse Artisans
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="bg-slate-50 min-h-[calc(100vh-64px)] py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Button
            variant="ghost"
            onClick={() => setLocation("/find-artisan")}
            className="mb-6"
          >
            ← Back to Artisans
          </Button>

          <div className="space-y-6">
            {/* Profile Header */}
            <Card className="border-none shadow-sm">
              <CardContent className="p-8">
                <div className="flex flex-col sm:flex-row sm:items-start gap-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-4">
                      <h1 className="text-3xl font-heading font-bold text-slate-900">
                        {userName}
                      </h1>
                      {profile.verified && (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Verified
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 mb-4">
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-100 text-base px-3 py-1">
                        {CATEGORIES[profile.category] || profile.category}
                      </Badge>
                      {rating && (
                        <div className="flex items-center gap-2">
                          <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                          <span className="font-medium">{rating}</span>
                          {reviewCount > 0 && (
                            <span className="text-slate-500 text-sm">({reviewCount} reviews)</span>
                          )}
                        </div>
                      )}
                    </div>
                    {profile.location && (
                      <div className="flex items-center gap-2 text-slate-600 mb-4">
                        <MapPin className="w-5 h-5" />
                        <span>{profile.location}</span>
                      </div>
                    )}
                    {profile.bio && (
                      <p className="text-slate-700 leading-relaxed">{profile.bio}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Experience & Skills */}
            <div className="grid md:grid-cols-2 gap-6">
              {profile.yearsExperience && (
                <Card className="border-none shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Briefcase className="w-5 h-5" />
                      Experience
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-slate-900">{profile.yearsExperience}</p>
                    <p className="text-slate-600">Years of experience</p>
                  </CardContent>
                </Card>
              )}

              {profile.skills && profile.skills.length > 0 && (
                <Card className="border-none shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Award className="w-5 h-5" />
                      Skills
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {profile.skills.map((skill, index) => (
                        <Badge key={index} variant="outline" className="bg-slate-50">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Certifications */}
            {profile.certifications && profile.certifications.length > 0 && (
              <Card className="border-none shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Award className="w-5 h-5" />
                    Certifications
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {profile.certifications.map((cert, index) => (
                      <li key={index} className="flex items-center gap-2 text-slate-700">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        {cert}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Location Map */}
            {profile.address && profile.latitude && profile.longitude && (
              <Card className="border-none shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Map className="w-5 h-5" />
                    Location
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-700 mb-4">{profile.address}</p>
                  <MapView
                    latitude={parseFloat(profile.latitude)}
                    longitude={parseFloat(profile.longitude)}
                    address={profile.address}
                    height="400px"
                    markerTitle={userName || "Artisan Location"}
                  />
                </CardContent>
              </Card>
            )}

            {/* Reviews */}
            <Card className="border-none shadow-sm">
              <CardHeader>
                <CardTitle>Reviews</CardTitle>
              </CardHeader>
              <CardContent>
                <ArtisanReviewsList
                  artisanId={userId || ""}
                  artisanName={userName || "Artisan"}
                  showTitle={false}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}
