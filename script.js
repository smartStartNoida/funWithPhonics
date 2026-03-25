/* ==========================================================================
   S-M-A-R-T Start Readers - Vanilla JS interactions
   - Mobile nav toggle
   - Animated hero background letters
   - Demo rhyming sound playback (Speech Synthesis)
   - Testimonials carousel
   - Scroll reveal animations
   - WhatsApp prefilled link
========================================================================== */

(() => {
	"use strict";

	// -----------------------------
	// Helpers
	// -----------------------------
	const $ = (sel, root = document) => root.querySelector(sel);
	const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

	// -----------------------------
	// Footer year
	// -----------------------------
	const yearEl = document.querySelector("[data-year]");
	if (yearEl) yearEl.textContent = String(new Date().getFullYear());

	// -----------------------------
	// Mobile nav
	// -----------------------------
	const navToggle = document.querySelector(".nav__toggle");
	const navLinks = document.querySelector("[data-nav-links]");

	if (navToggle && navLinks) {
		const setOpen = (open) => {
			navLinks.classList.toggle("is-open", open);
			navToggle.setAttribute("aria-expanded", String(open));

			// Animate the hamburger into an "X" by shifting pseudo lines using a class.
			navToggle.classList.toggle("is-open", open);
		};

		navToggle.addEventListener("click", () => {
			const open = !navLinks.classList.contains("is-open");
			setOpen(open);
		});

		// Close menu after clicking a link (mobile UX)
		navLinks.addEventListener("click", (e) => {
			const a = e.target.closest("a");
			if (!a) return;
			setOpen(false);
		});

		// Close on Escape
		window.addEventListener("keydown", (e) => {
			if (e.key === "Escape") setOpen(false);
		});
	}

	// -----------------------------
	// Hero floating letters
	// -----------------------------
	const lettersLayer = document.querySelector("[data-letters-layer]");
	if (lettersLayer) {
		const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
		const count = 22; // balanced for performance + visible sparkle

		for (let i = 0; i < count; i++) {
			const span = document.createElement("span");
			span.className = "float-letter";
			span.textContent = letters[Math.floor(Math.random() * letters.length)];

			// Randomize placement and styling
			const left = Math.random() * 100;
			const top = 60 + Math.random() * 90; // start lower so they float up through hero
			const size = 28 + Math.random() * 56;
			const dur = 9 + Math.random() * 12;
			const delay = -Math.random() * dur; // negative to avoid "all start at once"
			const alpha = 0.12 + Math.random() * 0.16;

			span.style.left = `${left}%`;
			span.style.top = `${top}%`;
			span.style.fontSize = `${size}px`;
			span.style.setProperty("--dur", `${dur}s`);
			span.style.animationDelay = `${delay}s`;
			span.style.color = `rgba(108, 99, 255, ${alpha})`;

			lettersLayer.appendChild(span);
		}
	}

	// -----------------------------
	// Scroll reveal
	// -----------------------------
	const revealEls = $$(".reveal");
	if (revealEls.length) {
		const io = new IntersectionObserver(
			(entries) => {
				for (const entry of entries) {
					if (!entry.isIntersecting) continue;
					entry.target.classList.add("is-visible");
					io.unobserve(entry.target);
				}
			},
			{ threshold: 0.14 }
		);

		for (const el of revealEls) io.observe(el);
	}

	// -----------------------------
	// Lightbox (tap any poster/gallery image to zoom)
	// -----------------------------
	const lightboxRoot = document.querySelector("[data-lightbox-root]");
	const lightboxImg = document.querySelector("[data-lightbox-img]");
	const lightboxCloseBtns = $$("[data-lightbox-close]");

	const openLightbox = (src, alt = "") => {
		if (!lightboxRoot || !lightboxImg) return;
		lightboxImg.src = src;
		lightboxImg.alt = alt || "Preview image";
		lightboxRoot.hidden = false;
		document.body.style.overflow = "hidden";
	};

	const closeLightbox = () => {
		if (!lightboxRoot || !lightboxImg) return;
		lightboxRoot.hidden = true;
		lightboxImg.src = "";
		lightboxImg.alt = "";
		document.body.style.overflow = "";
	};

	// Open (event delegation keeps it reusable)
	document.addEventListener("click", (e) => {
		const btn = e.target.closest("[data-lightbox]");
		if (!btn) return;
		const src = btn.getAttribute("data-lightbox");
		const img = btn.querySelector("img");
		const alt = img?.getAttribute("alt") || "";
		if (src) openLightbox(src, alt);
	});

	// Close buttons/backdrop
	for (const b of lightboxCloseBtns) b.addEventListener("click", closeLightbox);

	// Close on Escape
	window.addEventListener("keydown", (e) => {
		if (e.key === "Escape") closeLightbox();
	});

	// -----------------------------
	// Demo learning: words + sound (Speech Synthesis)
	// -----------------------------
	const selectedWordEl = document.querySelector("[data-selected-word]");
	const wordButtons = $$("[data-word]");
	const playSoundBtn = document.querySelector("[data-play-sound]");
	const playFamilyBtn = document.querySelector("[data-play-family]");

	const wordFamily = ["Cat", "Bat", "Hat", "Mat"];
	let selectedWord = "Cat";

	const setSelectedWord = (word) => {
		selectedWord = word;
		if (selectedWordEl) selectedWordEl.textContent = word;
		for (const btn of wordButtons) btn.classList.toggle("is-active", btn.dataset.word === word);
	};

	// Use SpeechSynthesis when available; fallback to a tiny beep using WebAudio.
	const canSpeak = "speechSynthesis" in window && "SpeechSynthesisUtterance" in window;
	let audioCtx = null;
	let preferredVoice = null;

	const getVoicesSafe = () => {
		try {
			return window.speechSynthesis.getVoices?.() || [];
		} catch {
			return [];
		}
	};

	const pickPreferredFemaleVoice = (voices) => {
		if (!Array.isArray(voices) || voices.length === 0) return null;

		// Heuristics: different browsers/OS name female voices differently.
		// Prefer common Windows/Edge/Chrome female voices first.
		const preferredNameHints = [
			"zira",
			"sonia",
			"jenny",
			"natasha",
			"aria",
			"susan",
			"hazel",
			"female",
		];

		const scoreVoice = (v) => {
			const name = String(v?.name || "").toLowerCase();
			const lang = String(v?.lang || "").toLowerCase();

			let score = 0;
			// English voices first (content is English words).
			if (lang.startsWith("en-")) score += 20;
			if (lang === "en-in") score += 6; // nice on Indian devices if available

			// Prefer local installed voices.
			if (v?.localService) score += 8;

			// Prefer "female" hints in the voice name.
			for (let i = 0; i < preferredNameHints.length; i++) {
				if (name.includes(preferredNameHints[i])) score += 40 - i;
			}

			return score;
		};

		let best = voices[0];
		let bestScore = scoreVoice(best);
		for (const v of voices) {
			const s = scoreVoice(v);
			if (s > bestScore) {
				best = v;
				bestScore = s;
			}
		}
		return best || null;
	};

	const refreshPreferredVoice = () => {
		if (!canSpeak) return;
		const voices = getVoicesSafe();
		const picked = pickPreferredFemaleVoice(voices);
		preferredVoice = picked || null;
	};

	if (canSpeak) {
		// Some browsers load voices async; this event fires when ready.
		window.speechSynthesis.addEventListener?.("voiceschanged", refreshPreferredVoice);
		refreshPreferredVoice();
	}

	const speak = (text) => {
		if (canSpeak) {
			// Cancel any in-flight speech so repeated clicks feel responsive.
			window.speechSynthesis.cancel();
			const u = new SpeechSynthesisUtterance(text);
			// Try to force a female voice when available.
			if (!preferredVoice) refreshPreferredVoice();
			if (preferredVoice) u.voice = preferredVoice;
			u.lang = preferredVoice?.lang || "en-US";
			// Softer + kid-friendly delivery.
			u.rate = 0.9;
			u.pitch = 1.15;
			u.volume = 0.78;
			window.speechSynthesis.speak(u);
			return;
		}

		// Fallback: short beep pattern so the button still "does something".
		audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
		const now = audioCtx.currentTime;
		const osc = audioCtx.createOscillator();
		const gain = audioCtx.createGain();
		osc.type = "sine";
		osc.frequency.setValueAtTime(660, now);
		gain.gain.setValueAtTime(0.0001, now);
		gain.gain.exponentialRampToValueAtTime(0.22, now + 0.02);
		gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);
		osc.connect(gain).connect(audioCtx.destination);
		osc.start(now);
		osc.stop(now + 0.3);
	};

	for (const btn of wordButtons) {
		btn.addEventListener("click", () => setSelectedWord(btn.dataset.word || "Cat"));
	}

	if (playSoundBtn) {
		playSoundBtn.addEventListener("click", () => speak(selectedWord));
	}

	if (playFamilyBtn) {
		playFamilyBtn.addEventListener("click", async () => {
			// Simple sequential playback (with small pauses)
			const seq = wordFamily.slice();
			if (canSpeak) window.speechSynthesis.cancel();

			for (let i = 0; i < seq.length; i++) {
				setSelectedWord(seq[i]);
				speak(seq[i]);
				// Wait roughly long enough for a short word to finish.
				// (Speech synthesis doesn't provide a reliable await across all browsers.)
				await new Promise((r) => setTimeout(r, 650));
			}
		});
	}

	// -----------------------------
	// Testimonials carousel
	// -----------------------------
	const carousel = document.querySelector("[data-carousel]");
	if (carousel) {
		const track = $("[data-carousel-track]", carousel);
		const prevBtn = $("[data-carousel-prev]", carousel);
		const nextBtn = $("[data-carousel-next]", carousel);
		const dotsWrap = $("[data-carousel-dots]", carousel);
		const slides = $$(".carousel__slide", carousel);

		let index = 0;
		let autoplayId = null;

		const slidesPerView = () => (window.matchMedia("(min-width: 860px)").matches ? 2 : 1);
		const maxIndex = () => Math.max(0, slides.length - slidesPerView());

		const buildDots = () => {
			if (!dotsWrap) return;
			dotsWrap.innerHTML = "";
			const pages = maxIndex() + 1;
			for (let i = 0; i < pages; i++) {
				const b = document.createElement("button");
				b.type = "button";
				b.className = "dot";
				b.setAttribute("aria-label", `Go to slide ${i + 1}`);
				b.addEventListener("click", () => {
					index = i;
					render();
					restartAutoplay();
				});
				dotsWrap.appendChild(b);
			}
		};

		const renderDots = () => {
			if (!dotsWrap) return;
			const dots = $$(".dot", dotsWrap);
			dots.forEach((d, i) => d.classList.toggle("is-active", i === index));
		};

		const render = () => {
			if (!track) return;
			const per = slidesPerView();
			const clamped = Math.min(Math.max(index, 0), Math.max(0, slides.length - per));
			index = clamped;

			// Use pixel-based translation so flex gap doesn't cause drift.
			// We move by one "card width + gap" per index.
			const first = slides[0];
			const gap = Number.parseFloat(getComputedStyle(track).gap || "0") || 0;
			const slideW = first ? first.getBoundingClientRect().width : 0;
			const offset = index * (slideW + gap);
			track.style.transform = `translateX(${-offset}px)`;
			renderDots();
		};

		const next = () => {
			index = index >= maxIndex() ? 0 : index + 1;
			render();
		};
		const prev = () => {
			index = index <= 0 ? maxIndex() : index - 1;
			render();
		};

		const stopAutoplay = () => {
			if (autoplayId) window.clearInterval(autoplayId);
			autoplayId = null;
		};
		const restartAutoplay = () => {
			stopAutoplay();
			autoplayId = window.setInterval(next, 5200);
		};

		buildDots();
		render();
		restartAutoplay();

		nextBtn?.addEventListener("click", () => {
			next();
			restartAutoplay();
		});
		prevBtn?.addEventListener("click", () => {
			prev();
			restartAutoplay();
		});

		// Pause autoplay on hover/focus (better UX)
		carousel.addEventListener("mouseenter", stopAutoplay);
		carousel.addEventListener("mouseleave", restartAutoplay);
		carousel.addEventListener("focusin", stopAutoplay);
		carousel.addEventListener("focusout", restartAutoplay);

		// Rebuild on resize (changes slides-per-view)
		window.addEventListener("resize", () => {
			buildDots();
			render();
		});
	}

	// -----------------------------
	// Contact: WhatsApp prefilled link + demo submit
	// -----------------------------
	const form = document.querySelector("[data-contact-form]");
	const waLink = document.querySelector("[data-whatsapp]");

	// -----------------------------
	// Back to top (reliable smooth scroll)
	// -----------------------------
	const backTop = document.querySelector(".back-top");
	backTop?.addEventListener("click", (e) => {
		// Hash scrolling can be flaky in some setups; this ensures it always works.
		e.preventDefault();
		window.scrollTo({ top: 0, behavior: "smooth" });
	});

	const buildWhatsAppUrl = ({ name, phone, message }) => {
		// NOTE: Replace the number below with your institute WhatsApp number (include country code).
		const whatsappNumber = "9311974596";
		const text = `Hello S-M-A-R-T Start Readers!%0A%0AName: ${encodeURIComponent(
			name
		)}%0APhone: ${encodeURIComponent(phone)}%0AMessage: ${encodeURIComponent(message)}`;
		return `https://wa.me/${whatsappNumber}?text=${text}`;
	};

	const getFormValues = () => {
		if (!form) return { name: "", phone: "", message: "" };
		const fd = new FormData(form);
		return {
			name: String(fd.get("name") || "").trim(),
			phone: String(fd.get("phone") || "").trim(),
			message: String(fd.get("message") || "").trim(),
		};
	};

	const syncWhatsAppLink = () => {
		if (!waLink) return;
		const v = getFormValues();
		waLink.href = buildWhatsAppUrl(v);
	};

	form?.addEventListener("input", syncWhatsAppLink);
	syncWhatsAppLink();

	form?.addEventListener("submit", (e) => {
		e.preventDefault();
		// Demo-only: show a friendly confirmation without any backend.
		const { name } = getFormValues();
		alert(`Thanks${name ? `, ${name}` : ""}! Your message is ready — you can also use WhatsApp.`);
	});
})();