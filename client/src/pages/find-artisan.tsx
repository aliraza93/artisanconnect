import { useState, useEffect, useCallback } from "react";
import { Layout } from "@/components/layout/layout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, Search, X } from "lucide-react";
import { api, type ArtisanProfileWithUser } from "@/lib/api";
import { useLocation } from "wouter";
import { useSEO } from "@/hooks/use-seo";
import { useDebounce } from "@/hooks/use-debounce";

const CATEGORIES = [
  { value: "all", label: "All Categories" },
  { value: "plumber", label: "Plumbing" },
  { value: "electrician", label: "Electrical" },
  { value: "carpenter", label: "Building & Renovation" },
  { value: "painter", label: "Painting" },
  { value: "hvac", label: "HVAC" },
  { value: "welder", label: "Welding" },
  { value: "architect", label: "Architecture" },
  { value: "cctv", label: "CCTV & Security" },
  { value: "automation", label: "Home Automation" },
  { value: "solar", label: "Solar Installation" },
  { value: "generators", label: "Generators" },
  { value: "logistics", label: "Logistics & Transport" },
  { value: "general", label: "General Handyman" },
];

export default function FindArtisan() {
  const [, setLocation] = useLocation();
  const [artisans, setArtisans] = useState<ArtisanProfileWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<string>("all");
  const [locationFilter, setLocationFilter] = useState<string>("");
  const [search, setSearch] = useState<string>("");
  const debouncedSearch = useDebounce(search, 300);
  const debouncedLocation = useDebounce(locationFilter, 300);

  useSEO({
    title: 'Find an Artisan - Browse Verified Professionals',
    description: 'Browse verified artisans by category and location. Find plumbers, electricians, builders, and more in your area.'
  });

  const fetchArtisans = useCallback(async () => {
    setLoading(true);
    try {
      const filters: { category?: string; location?: string; search?: string } = {};
      if (category && category !== "all") {
        filters.category = category;
      }
      if (debouncedLocation.trim()) {
        filters.location = debouncedLocation.trim();
      }
      if (debouncedSearch.trim()) {
        filters.search = debouncedSearch.trim();
      }

      const data = await api.getAllArtisans(Object.keys(filters).length > 0 ? filters : undefined);
      setArtisans(data);
    } catch (error) {
      console.error("Failed to fetch artisans:", error);
      setArtisans([]);
    } finally {
      setLoading(false);
    }
  }, [category, debouncedLocation, debouncedSearch]);

  useEffect(() => {
    fetchArtisans();
  }, [fetchArtisans]);

  // Update URL params
  useEffect(() => {
    const params = new URLSearchParams();
    if (category !== "all") params.set("category", category);
    if (locationFilter) params.set("location", locationFilter);
    if (search) params.set("search", search);
    const queryString = params.toString();
    window.history.replaceState({}, "", queryString ? `/find-artisan?${queryString}` : "/find-artisan");
  }, [category, locationFilter, search]);

  // Read URL params on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlCategory = params.get("category");
    const urlLocation = params.get("location");
    const urlSearch = params.get("search");
    if (urlCategory) setCategory(urlCategory);
    if (urlLocation) setLocationFilter(urlLocation);
    if (urlSearch) setSearch(urlSearch);
  }, []);

  const clearFilters = () => {
    setCategory("all");
    setLocationFilter("");
    setSearch("");
  };

  const hasActiveFilters = category !== "all" || locationFilter || search;

  return (
    <Layout>
      <div className="bg-slate-50 min-h-[calc(100vh-64px)] py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-heading font-bold text-slate-900 mb-2">Find an Artisan</h1>
            <p className="text-slate-600">Browse verified professionals in your area</p>
          </div>

          {/* Filters */}
          <Card className="mb-6 border-none shadow-sm">
            <CardContent className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <Input
                      placeholder="Search by name..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-10 h-11"
                    />
                  </div>
                </div>
                <div className="flex-1">
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1">
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <Input
                      placeholder="Filter by location..."
                      value={locationFilter}
                      onChange={(e) => setLocationFilter(e.target.value)}
                      className="pl-10 h-11"
                    />
                  </div>
                </div>
                {hasActiveFilters && (
                  <Button
                    variant="outline"
                    onClick={clearFilters}
                    className="h-11"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Clear
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Results */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="border-none shadow-sm">
                  <CardContent className="p-6">
                    <Skeleton className="h-6 w-3/4 mb-4" />
                    <Skeleton className="h-4 w-1/2 mb-2" />
                    <Skeleton className="h-4 w-2/3" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : artisans.length === 0 ? (
            <Card className="border-none shadow-sm">
              <CardContent className="p-12 text-center">
                <p className="text-slate-500 text-lg mb-2">No artisans found</p>
                <p className="text-slate-400 text-sm">
                  {hasActiveFilters
                    ? "Try adjusting your filters"
                    : "Check back later for new artisans"}
                </p>
                {hasActiveFilters && (
                  <Button variant="outline" onClick={clearFilters} className="mt-4">
                    Clear Filters
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="mb-4 text-sm text-slate-600">
                Found {artisans.length} artisan{artisans.length !== 1 ? "s" : ""}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {artisans.map((artisan) => (
                  <Card
                    key={artisan.id}
                    className="border-none shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => setLocation(`/artisan/${artisan.userId}`)}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="font-bold text-slate-900 text-lg">
                          {artisan.userName}
                        </h3>
                        {artisan.verified && (
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">
                            Verified
                          </Badge>
                        )}
                      </div>
                      <div className="space-y-2">
                        <div>
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-100">
                            {CATEGORIES.find(c => c.value === artisan.category)?.label || artisan.category}
                          </Badge>
                        </div>
                        {artisan.location && (
                          <div className="flex items-center gap-2 text-sm text-slate-500">
                            <MapPin className="w-4 h-4" />
                            <span>{artisan.location}</span>
                          </div>
                        )}
                        {artisan.yearsExperience && (
                          <div className="text-sm text-slate-600">
                            {artisan.yearsExperience} years experience
                          </div>
                        )}
                        {artisan.bio && (
                          <p className="text-sm text-slate-600 line-clamp-2 mt-2">
                            {artisan.bio}
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </Layout>
  );
}
