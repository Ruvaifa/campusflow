import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Menu, X, Sun, Moon, Activity, Lock, Eye, Zap, Database, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AnimatedGroup } from '@/components/ui/animated-group';
import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeContext';

const transitionVariants = {
  item: {
    hidden: { opacity: 0, filter: "blur(10px)", y: 20 },
    visible: {
      opacity: 1,
      filter: "blur(0px)",
      y: 0,
      transition: {
        type: "spring" as const,
        bounce: 0.4,
        duration: 0.8,
      },
    },
  },
};

export function Hero() {
  return (
    <>
      <HeroHeader />
      <main className="overflow-hidden">
        {/* Background gradients */}
        <div
          aria-hidden
          className="z-[2] absolute inset-0 pointer-events-none isolate opacity-50 contain-strict hidden lg:block">
          <div className="w-[35rem] h-[80rem] -translate-y-[350px] absolute left-0 top-0 -rotate-45 rounded-full bg-[radial-gradient(68.54%_68.72%_at_55.02%_31.46%,hsla(0,0%,85%,.08)_0,hsla(0,0%,55%,.02)_50%,hsla(0,0%,45%,0)_80%)]" />
          <div className="h-[80rem] absolute left-0 top-0 w-56 -rotate-45 rounded-full bg-[radial-gradient(50%_50%_at_50%_50%,hsla(0,0%,85%,.06)_0,hsla(0,0%,45%,.02)_80%,transparent_100%)] [translate:5%_-50%]" />
        </div>

        {/* Hero Section */}
        <section>
          <div className="relative pt-24 md:pt-36">
            <div aria-hidden className="absolute inset-0 -z-10 size-full [background:radial-gradient(125%_125%_at_50%_100%,transparent_0%,var(--background)_75%)]" />
            <div className="mx-auto max-w-7xl px-6">
              <div className="text-center sm:mx-auto lg:mr-auto lg:mt-0">
                <AnimatedGroup variants={transitionVariants}>
                  <Link
                    to="/dashboard"
                    className="hover:bg-background dark:hover:border-t-border bg-muted group mx-auto flex w-fit items-center gap-4 rounded-full border p-1 pl-4 shadow-md shadow-black/5 transition-all duration-300 dark:border-t-white/5 dark:shadow-zinc-950">
                    <span className="text-foreground text-sm">Advanced AI-Powered Entity Resolution</span>
                    <span className="dark:border-background block h-4 w-0.5 border-l bg-white dark:bg-zinc-700"></span>
                    <div className="bg-background group-hover:bg-muted size-6 overflow-hidden rounded-full duration-500">
                      <Shield className="m-auto size-3 mt-1.5" />
                    </div>
                  </Link>

                  <h1 className="mt-8 max-w-4xl mx-auto text-balance text-5xl md:text-6xl lg:mt-16 xl:text-7xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                    Campus Security & Entity Resolution System
                  </h1>
                  
                  <p className="mx-auto mt-8 max-w-2xl text-balance text-lg text-muted-foreground">
                    Real-time monitoring and intelligent entity resolution across multiple campus data sources. 
                    Detect anomalies, track activities, and ensure campus security with AI-powered analytics.
                  </p>
                </AnimatedGroup>

                <AnimatedGroup
                  variants={{
                    container: {
                      visible: {
                        transition: {
                          staggerChildren: 0.05,
                          delayChildren: 0.75,
                        },
                      },
                    },
                    ...transitionVariants,
                  }}
                  className="mt-12 flex flex-col items-center justify-center gap-3 md:flex-row">
                  <div className="bg-foreground/10 rounded-[14px] border p-0.5">
                    <Button
                      asChild
                      size="lg"
                      className="rounded-xl px-6 text-base h-12">
                      <Link to="/login">
                        <Shield className="mr-2 size-4" />
                        <span className="text-nowrap">Sign In</span>
                      </Link>
                    </Button>
                  </div>
                  <Button
                    asChild
                    size="lg"
                    variant="outline"
                    className="h-12 rounded-xl px-6 border-2">
                    <Link to="/signup">
                      <span className="text-nowrap">Create Account</span>
                    </Link>
                  </Button>
                </AnimatedGroup>
              </div>
            </div>

            {/* Dashboard Preview */}
            <AnimatedGroup
              variants={{
                container: {
                  visible: {
                    transition: {
                      staggerChildren: 0.05,
                      delayChildren: 0.75,
                    },
                  },
                },
                ...transitionVariants,
              }}>
              <div className="relative -mr-56 mt-12 overflow-hidden px-2 sm:mr-0 sm:mt-16 md:mt-24">
                <div
                  aria-hidden
                  className="bg-gradient-to-b to-background absolute inset-0 z-10 from-transparent from-35%"
                />
                <div className="inset-shadow-2xs ring-background dark:inset-shadow-white/20 bg-background relative mx-auto max-w-6xl overflow-hidden rounded-2xl border p-4 shadow-2xl shadow-zinc-950/15 ring-1">
                  <img
                    className="bg-background aspect-video relative rounded-xl border border-border/50"
                    src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&h=675&fit=crop"
                    alt="Dashboard Preview"
                    width="1200"
                    height="675"
                  />
                </div>
              </div>
            </AnimatedGroup>
          </div>
        </section>

        {/* Features Section */}
        <section className="bg-background pb-16 pt-24 md:pb-32 md:pt-32">
          <div className="mx-auto max-w-7xl px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Powerful Security Features</h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                Comprehensive tools for campus security monitoring and entity resolution
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="group relative rounded-2xl border bg-card p-6 shadow-sm transition-all hover:shadow-lg hover:border-primary/50">
                  <div className="mb-4 inline-flex rounded-lg bg-primary/10 p-3">
                    <feature.icon className="size-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="bg-muted/30 py-16 md:py-24">
          <div className="mx-auto max-w-7xl px-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-4xl md:text-5xl font-bold text-primary mb-2">
                    {stat.value}
                  </div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-background py-16 md:py-24">
          <div className="mx-auto max-w-4xl px-6 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to Secure Your Campus?
            </h2>
            <p className="text-muted-foreground text-lg mb-8">
              Join institutions using CampusFlow for advanced security monitoring
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="rounded-xl px-8">
                <Link to="/signup">
                  Get Started Free
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="rounded-xl px-8">
                <Link to="/login">
                  Sign In
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}

const features = [
  {
    icon: Activity,
    title: 'Real-Time Monitoring',
    description: 'Track entity movements and activities across campus in real-time with live updates and alerts.',
  },
  {
    icon: Database,
    title: 'Multi-Source Integration',
    description: 'Seamlessly integrate data from swipe cards, WiFi logs, CCTV, and booking systems.',
  },
  {
    icon: Eye,
    title: 'Entity Resolution',
    description: 'Advanced AI algorithms to accurately resolve and track entities across multiple data sources.',
  },
  {
    icon: Shield,
    title: 'Security Alerts',
    description: 'Automated anomaly detection and intelligent alerting for suspicious activities.',
  },
  {
    icon: Users,
    title: 'Entity Management',
    description: 'Comprehensive profiles with activity history, patterns, and behavioral analytics.',
  },
  {
    icon: Zap,
    title: 'Fast & Scalable',
    description: 'Handle thousands of entities and millions of events with sub-second query performance.',
  },
];

const stats = [
  { value: '7K+', label: 'Active Entities' },
  { value: '99.9%', label: 'Uptime' },
  { value: '24/7', label: 'Monitoring' },
  { value: '<100ms', label: 'Response Time' },
];

const menuItems = [
  { name: 'Features', href: '#features' },
  { name: 'Security', href: '#security' },
  { name: 'About', href: '#about' },
  { name: 'Contact', href: '#contact' },
];

const HeroHeader = () => {
  const [menuState, setMenuState] = React.useState(false);
  const [isScrolled, setIsScrolled] = React.useState(false);
  const { theme, toggleTheme } = useTheme();

  React.useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header>
      <nav
        data-state={menuState && 'active'}
        className="fixed z-20 w-full px-2 group">
        <div
          className={cn(
            'mx-auto mt-2 max-w-6xl px-6 transition-all duration-300 lg:px-12',
            isScrolled && 'bg-background/80 max-w-4xl rounded-2xl border backdrop-blur-lg lg:px-5 shadow-lg'
          )}>
          <div className="relative flex flex-wrap items-center justify-between gap-6 py-3 lg:gap-0 lg:py-4">
            <div className="flex w-full justify-between lg:w-auto">
              <Link
                to="/"
                aria-label="home"
                className="flex items-center space-x-2">
                <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
                  <Shield className="w-6 h-6 text-primary-foreground" />
                </div>
                <span className="font-bold text-xl">CampusFlow</span>
              </Link>

              <button
                onClick={() => setMenuState(!menuState)}
                aria-label={menuState ? 'Close Menu' : 'Open Menu'}
                className="relative z-20 -m-2.5 -mr-4 block cursor-pointer p-2.5 lg:hidden">
                <Menu className="group-data-[state=active]:scale-0 group-data-[state=active]:opacity-0 m-auto size-6 duration-200" />
                <X className="group-data-[state=active]:rotate-0 group-data-[state=active]:scale-100 group-data-[state=active]:opacity-100 absolute inset-0 m-auto size-6 -rotate-180 scale-0 opacity-0 duration-200" />
              </button>
            </div>

            <div className="absolute inset-0 m-auto hidden size-fit lg:block">
              <ul className="flex gap-8 text-sm">
                {menuItems.map((item, index) => (
                  <li key={index}>
                    <a
                      href={item.href}
                      className="text-muted-foreground hover:text-foreground block duration-150">
                      <span>{item.name}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-background group-data-[state=active]:block lg:group-data-[state=active]:flex mb-6 hidden w-full flex-wrap items-center justify-end space-y-8 rounded-3xl border p-6 shadow-2xl shadow-zinc-300/20 md:flex-nowrap lg:m-0 lg:flex lg:w-fit lg:gap-3 lg:space-y-0 lg:border-transparent lg:bg-transparent lg:p-0 lg:shadow-none dark:shadow-none">
              <div className="lg:hidden">
                <ul className="space-y-6 text-base">
                  {menuItems.map((item, index) => (
                    <li key={index}>
                      <a
                        href={item.href}
                        className="text-muted-foreground hover:text-foreground block duration-150">
                        <span>{item.name}</span>
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div className="flex w-full flex-col space-y-3 sm:flex-row sm:gap-3 sm:space-y-0 md:w-fit lg:items-center">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleTheme}
                  className="rounded-xl">
                  {theme === 'light' ? (
                    <Moon className="size-5" />
                  ) : (
                    <Sun className="size-5" />
                  )}
                </Button>
                
                <Button
                  asChild
                  variant="ghost"
                  size="sm"
                  className={cn('rounded-xl', isScrolled && 'lg:hidden')}>
                  <Link to="/login">
                    <span>Login</span>
                  </Link>
                </Button>
                
                <Button
                  asChild
                  size="sm"
                  className={cn('rounded-xl', isScrolled && 'lg:hidden')}>
                  <Link to="/signup">
                    <span>Sign Up</span>
                  </Link>
                </Button>
                
                <Button
                  asChild
                  size="sm"
                  className={cn('rounded-xl', isScrolled ? 'lg:inline-flex' : 'hidden')}>
                  <Link to="/login">
                    <Shield className="mr-2 size-4" />
                    <span>Get Started</span>
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
};
