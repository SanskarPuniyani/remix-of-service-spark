import Navbar from "@/components/landing/Navbar";
import HeroSection from "@/components/landing/HeroSection";
import FeaturesSection from "@/components/landing/FeaturesSection";
import CategoriesSection from "@/components/landing/CategoriesSection";
import Footer from "@/components/landing/Footer";
import PageTransition from "@/components/effects/PageTransition";

const Index = () => {
  return (
    <PageTransition>
      <div className="min-h-screen relative">
        <Navbar />
        <HeroSection />
        <FeaturesSection />
        <CategoriesSection />
        <Footer />
      </div>
    </PageTransition>
  );
};

export default Index;
