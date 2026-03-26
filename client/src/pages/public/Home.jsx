import HeroSection from '../../sections/HeroSection';
import AboutSection from '../../sections/AboutSection';
import PortfolioSection from '../../sections/PortfolioSection';
import SkillsSection from '../../sections/SkillsSection';
import CertificationsSection from '../../sections/CertificationsSection';
import ContactSection from '../../sections/ContactSection';

export default function Home() {
  return (
    <>
      <HeroSection />
      <AboutSection />
      <PortfolioSection />
      <SkillsSection />
      <CertificationsSection />
      <ContactSection />
    </>
  );
}
