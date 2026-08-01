import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useMotionValue, animate, useReducedMotion } from 'framer-motion';
import { ArrowRight, Award, BarChart3, BookOpen, Check, ChevronLeft, ChevronRight, Clock, Play, Star, Trophy } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

const AUTOPLAY_MS = 6000;
const DRAG_THRESHOLD = 56;
const EASE = [0.22, 1, 0.36, 1] as const;

interface CarouselSlide {
  id: string;
  titleKey: string;
  descKey: string;
  ctaKey: string;
  ctaTo: string;
  visual: React.ReactNode;
  bullets: string[];
}

const CHECK_ICONS = [Check, Clock, BookOpen];

function VisualPace() {
  const { t } = useLanguage();
  const reducedMotion = useReducedMotion();
  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden bg-gradient-to-br from-emerald-950 via-slate-950 to-teal-950 p-8 sm:p-10">
      <div className="absolute inset-0 opacity-[0.04] [background-image:linear-gradient(rgba(255,255,255,.1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.1)_1px,transparent_1px)] [background-size:44px_44px]" />
      <motion.div
        className="relative w-full max-w-sm rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm"
        animate={reducedMotion ? undefined : { y: [0, -6, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      >
        <div className="flex items-center justify-between">
          <div className="text-xs font-semibold text-emerald-300">{t('landing.cvPaceCourse')}</div>
          <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-bold text-emerald-300">{t('landing.cvPaceProgress')}</span>
        </div>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
          <div className="h-full w-2/3 rounded-full bg-gradient-to-r from-emerald-400 to-teal-300" />
        </div>
        <div className="mt-5 space-y-3">
          {[t('landing.cvPaceLesson1'), t('landing.cvPaceLesson2'), t('landing.cvPaceLesson3')].map((lesson, i) => (
            <div key={lesson} className="flex items-center gap-3 rounded-xl bg-white/5 px-3 py-2.5">
              <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${i === 2 ? 'bg-emerald-500/15 text-emerald-300' : 'bg-emerald-500 text-emerald-950'}`}>
                {i === 2 ? <Play className="h-3 w-3" /> : <Check className="h-3 w-3" />}
              </span>
              <span className={`flex-1 text-xs ${i === 2 ? 'text-white' : 'text-white/60 line-through'}`}>{lesson}</span>
              <Clock className="h-3.5 w-3.5 text-white/40" />
            </div>
          ))}
        </div>
        <div className="mt-5 flex items-center justify-between">
          <span className="rounded-lg bg-emerald-500 px-4 py-2 text-xs font-bold text-emerald-950">{t('landing.cvPaceCta')}</span>
          <span className="text-[11px] text-white/40">{t('landing.cvPaceRemaining')}</span>
        </div>
      </motion.div>
    </div>
  );
}

function VisualInteractive() {
  const { t } = useLanguage();
  const reducedMotion = useReducedMotion();
  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden bg-gradient-to-br from-teal-950 via-slate-950 to-emerald-950 p-8 sm:p-10">
      <div className="absolute inset-0 opacity-[0.04] [background-image:linear-gradient(rgba(255,255,255,.1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.1)_1px,transparent_1px)] [background-size:44px_44px]" />
      <motion.div
        className="relative w-full max-w-sm rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm"
        animate={reducedMotion ? undefined : { y: [0, 6, 0] }}
        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
      >
        <div className="flex items-center justify-between">
          <div className="text-xs font-semibold text-white/80">{t('landing.cvQuizTitle')}</div>
          <span className="flex items-center gap-1 rounded-full bg-amber-400/15 px-2 py-0.5 text-xs font-bold text-amber-300">
            <Star className="h-3 w-3" /> {t('landing.cvQuizScore')}
          </span>
        </div>
        <p className="mt-4 text-sm font-medium text-white">{t('landing.cvQuizQuestion')}</p>
        <div className="mt-4 space-y-2.5">
          {[t('landing.cvQuizOpt1'), t('landing.cvQuizOpt2'), t('landing.cvQuizOpt3'), t('landing.cvQuizOpt4')].map((opt, i) => (
            <div
              key={opt}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-medium ${i === 1 ? 'border border-emerald-400/60 bg-emerald-500/15 text-emerald-200' : 'bg-white/5 text-white/60'}`}
            >
              <span className={`flex h-5 w-5 items-center justify-center rounded-full border text-[10px] ${i === 1 ? 'border-emerald-400 text-emerald-300' : 'border-white/20'}`}>
                {['A', 'B', 'C', 'D'][i]}
              </span>
              {opt}
              {i === 1 && <Check className="ml-auto h-4 w-4 text-emerald-300" />}
            </div>
          ))}
        </div>
        <div className="mt-5 flex items-center gap-2">
          <span className="rounded-lg bg-teal-400 px-4 py-2 text-xs font-bold text-teal-950">{t('landing.cvQuizCta')}</span>
          <span className="flex items-center gap-1 text-[11px] text-white/40"><Clock className="h-3 w-3" /> {t('landing.cvQuizTime')}</span>
        </div>
      </motion.div>
    </div>
  );
}

function VisualAchieve() {
  const { t } = useLanguage();
  const reducedMotion = useReducedMotion();
  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden bg-gradient-to-br from-slate-950 via-emerald-950 to-teal-950 p-8 sm:p-10">
      <div className="absolute inset-0 opacity-[0.04] [background-image:linear-gradient(rgba(255,255,255,.1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.1)_1px,transparent_1px)] [background-size:44px_44px]" />
      <motion.div
        className="relative w-full max-w-sm rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm text-center"
        animate={reducedMotion ? undefined : { y: [0, -6, 0] }}
        transition={{ duration: 6.5, repeat: Infinity, ease: 'easeInOut' }}
      >
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-300 to-amber-500 text-amber-950 shadow-lg shadow-amber-500/20">
          <Award className="h-7 w-7" />
        </div>
        <div className="mt-4 text-xs font-bold uppercase tracking-widest text-amber-300">{t('landing.cvCertTitle')}</div>
        <div className="mt-3 text-lg font-bold text-white">{t('landing.cvCertCourse')}</div>
        <div className="mt-1 text-xs text-white/50">{t('landing.cvCertAwarded')}</div>
        <div className="mt-5 grid grid-cols-3 gap-2">
          {[
            { icon: <Trophy className="h-4 w-4" />, label: t('landing.cvCertCourses'), value: '12' },
            { icon: <BarChart3 className="h-4 w-4" />, label: t('landing.cvCertAvgScore'), value: '96%' },
            { icon: <BookOpen className="h-4 w-4" />, label: t('landing.cvCertHours'), value: '240' },
          ].map(s => (
            <div key={s.label} className="rounded-xl bg-white/5 px-2 py-3">
              <div className="mx-auto flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-300">{s.icon}</div>
              <div className="mt-2 text-sm font-bold text-white">{s.value}</div>
              <div className="text-[10px] text-white/50">{s.label}</div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

export default function EducationalCarousel() {
  const { t } = useLanguage();
  const reducedMotion = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const trackX = useMotionValue(0);
  const viewportRef = useRef<HTMLDivElement>(null);
  const [slideWidth, setSlideWidth] = useState(0);

  const slides: CarouselSlide[] = [
    {
      id: 'own-pace',
      titleKey: 'landing.carousel1Title',
      descKey: 'landing.carousel1Desc',
      ctaKey: 'landing.carousel1Cta',
      ctaTo: '/pricing',
      visual: <VisualPace />,
      bullets: ['landing.journeyDesc1', 'landing.featureBulletPace1', 'landing.featureBulletPace2'],
    },
    {
      id: 'interactive',
      titleKey: 'landing.carousel2Title',
      descKey: 'landing.carousel2Desc',
      ctaKey: 'landing.carousel2Cta',
      ctaTo: '/register',
      visual: <VisualInteractive />,
      bullets: ['landing.featureBulletInteractive1', 'landing.featureBulletInteractive2', 'landing.featureBulletInteractive3'],
    },
    {
      id: 'achieve',
      titleKey: 'landing.carousel3Title',
      descKey: 'landing.carousel3Desc',
      ctaKey: 'landing.carousel3Cta',
      ctaTo: '/pricing',
      visual: <VisualAchieve />,
      bullets: ['landing.featureBulletAchieve1', 'landing.featureBulletAchieve2', 'landing.featureBulletAchieve3'],
    },
  ];

  const slideCount = slides.length;

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const update = () => setSlideWidth(el.offsetWidth);
    update();
    if (typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver(update);
      observer.observe(el);
      return () => observer.disconnect();
    }
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  const goTo = useCallback(
    (target: number) => {
      setIndex(((target % slideCount) + slideCount) % slideCount);
    },
    [slideCount],
  );

  const next = useCallback(() => setIndex(prev => (prev + 1) % slideCount), [slideCount]);
  const prev = useCallback(() => setIndex(prev => (prev - 1 + slideCount) % slideCount), [slideCount]);

  useEffect(() => {
    const target = -index * slideWidth;
    if (slideWidth === 0) return;
    if (reducedMotion) {
      trackX.set(target);
      return;
    }
    const controls = animate(trackX, target, { duration: 0.55, ease: EASE });
    return controls.stop;
  }, [index, trackX, slideWidth, reducedMotion]);

  useEffect(() => {
    if (reducedMotion || paused) return;
    const id = window.setTimeout(next, AUTOPLAY_MS);
    return () => window.clearTimeout(id);
  }, [next, reducedMotion, paused, index]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      next();
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      prev();
    } else if (e.key === 'Home') {
      e.preventDefault();
      goTo(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      goTo(slideCount - 1);
    }
  };

  const handleDragEnd = (_: unknown, info: { offset: { x: number } }) => {
    if (info.offset.x < -DRAG_THRESHOLD) {
      next();
    } else if (info.offset.x > DRAG_THRESHOLD) {
      prev();
    } else if (slideWidth > 0) {
      const target = -index * slideWidth;
      if (reducedMotion) trackX.set(target);
      else animate(trackX, target, { duration: 0.45, ease: EASE });
    }
  };

  return (
    <section
      aria-roledescription="carousel"
      aria-label={t('landing.carouselRegionLabel')}
      onKeyDown={handleKeyDown}
      className="relative overflow-hidden bg-white dark:bg-gray-900"
    >
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <motion.div
          initial={reducedMotion ? false : { opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6, ease: EASE }}
          className="mx-auto mb-12 max-w-2xl text-center"
        >
          <span className="inline-block rounded-full bg-emerald-100 dark:bg-emerald-900/30 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
            {t('landing.carouselRegionLabel')}
          </span>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-gray-900 dark:text-white md:text-4xl">
            {t('landing.carouselTitle')}
          </h2>
          <p className="mt-4 text-gray-500 dark:text-gray-400">{t('landing.carouselSubtitle')}</p>
        </motion.div>

        <motion.div
          ref={viewportRef}
          initial={reducedMotion ? false : { opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.7, ease: EASE, delay: 0.1 }}
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onFocusCapture={() => setPaused(true)}
          onBlurCapture={() => setPaused(false)}
          tabIndex={0}
          role="group"
          aria-label={t('landing.carouselTitle')}
          className="group relative overflow-hidden rounded-3xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-xl dark:shadow-gray-900/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
        >
          <motion.div
            drag={reducedMotion ? false : 'x'}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.12}
            style={{ x: trackX }}
            onDragEnd={handleDragEnd}
            className="flex cursor-grab active:cursor-grabbing"
          >
            {slides.map((slide, i) => (
              <div
                key={slide.id}
                role="group"
                aria-roledescription="slide"
                aria-label={t('landing.carouselSlideLabel').replace('{current}', String(i + 1)).replace('{total}', String(slideCount))}
                aria-hidden={i !== index}
                inert={i !== index}
                className="grid w-full shrink-0 grid-cols-1 lg:grid-cols-2"
              >
                <div className={`relative min-h-[320px] sm:min-h-[380px] lg:min-h-0 ${i % 2 === 1 ? 'lg:order-2' : ''}`}>
                  {slide.visual}
                </div>
                <div className="flex flex-col justify-center p-8 sm:p-12">
                  <motion.div
                    initial={false}
                    animate={i === index ? { opacity: 1, y: 0 } : { opacity: 0, y: reducedMotion ? 0 : 24 }}
                    transition={{ duration: 0.5, ease: EASE, delay: i === index && !reducedMotion ? 0.12 : 0 }}
                  >
                    <span className="inline-flex w-fit items-center gap-2 rounded-full bg-emerald-100 dark:bg-emerald-900/30 px-3 py-1 text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                      {t('landing.carouselRegionLabel')}
                    </span>
                    <h3 className="mt-4 text-2xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-3xl">
                      {t(slide.titleKey)}
                    </h3>
                    <p className="mt-4 text-gray-500 dark:text-gray-400 leading-relaxed">{t(slide.descKey)}</p>
                    <ul className="mt-6 space-y-3">
                      {slide.bullets.map((bullet, b) => {
                        const Icon = CHECK_ICONS[b % CHECK_ICONS.length];
                        return (
                          <li key={b} className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
                            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
                              <Icon className="h-3.5 w-3.5" />
                            </span>
                            {t(bullet)}
                          </li>
                        );
                      })}
                    </ul>
                    <div className="mt-8">
                      <Link
                        to={slide.ctaTo}
                        className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-700/25 transition-colors hover:bg-emerald-800"
                      >
                        {t(slide.ctaKey)}
                        <ArrowRight className="h-4 w-4 rtl:rotate-180" />
                      </Link>
                    </div>
                  </motion.div>
                </div>
              </div>
            ))}
          </motion.div>

          <div className="relative flex items-center justify-between gap-4 border-t border-gray-100 dark:border-gray-700 px-4 py-3 sm:px-6">
            <button
              type="button"
              onClick={prev}
              aria-label={t('landing.carouselPrev')}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-300 transition-colors hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              <ChevronLeft className="h-5 w-5 rtl:rotate-180" />
            </button>

            <div className="flex items-center gap-2" role="group" aria-label={t('landing.carouselTitle')}>
              {slides.map((slide, i) => (
                <button
                  key={slide.id}
                  type="button"
                  aria-label={`${t('landing.carouselGoTo')} ${i + 1}`}
                  aria-current={i === index ? 'true' : undefined}
                  onClick={() => goTo(i)}
                  className={`h-2.5 rounded-full transition-all duration-300 ${i === index ? 'w-8 bg-emerald-600' : 'w-2.5 bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500'}`}
                />
              ))}
            </div>

            <button
              type="button"
              onClick={next}
              aria-label={t('landing.carouselNext')}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-300 transition-colors hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              <ChevronRight className="h-5 w-5 rtl:rotate-180" />
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
