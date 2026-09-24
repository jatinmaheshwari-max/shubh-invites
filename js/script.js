/* =====================================================
   LIBESOLE
   MAIN JAVASCRIPT
===================================================== */

const WHATSAPP_NUMBER = "916398252681";
const CONTACT_EMAIL = "jatinmaheshwari20@gmail.com";

/*
 * Google Apps Script web app that saves leads to your private Google Sheet
 * and emails you. Paste the "/exec" URL from the deployment here.
 * Setup steps: setup/lead-sheet.gs
 */
const LEAD_ENDPOINT = "https://script.google.com/macros/s/AKfycbzyr5qVCMiwmEIeKZd6wBn2KnTGTBijeSlHNTkAxSXDZrMfxnOsXCNMa6Uiu28OJtm1/exec";

const prefersReducedMotion =
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;


/* =====================================================
   MOBILE MENU
===================================================== */

const menuToggle = document.querySelector(".menu-toggle");
const mobileNav = document.querySelector(".mobile-nav");

if (menuToggle && mobileNav) {

    const setMenuOpen = (isOpen) => {
        mobileNav.classList.toggle("active", isOpen);
        menuToggle.setAttribute("aria-expanded", String(isOpen));
        menuToggle.setAttribute(
            "aria-label",
            isOpen ? "Close navigation menu" : "Open navigation menu"
        );
    };

    menuToggle.addEventListener("click", () => {
        setMenuOpen(!mobileNav.classList.contains("active"));
    });

    mobileNav.querySelectorAll("a").forEach((link) => {
        link.addEventListener("click", () => setMenuOpen(false));
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && mobileNav.classList.contains("active")) {
            setMenuOpen(false);
            menuToggle.focus();
        }
    });

    document.addEventListener("click", (event) => {
        if (
            mobileNav.classList.contains("active") &&
            !mobileNav.contains(event.target) &&
            !menuToggle.contains(event.target)
        ) {
            setMenuOpen(false);
        }
    });

}


/* =====================================================
   HEADER SCROLL EFFECT
===================================================== */

const header = document.querySelector(".site-header");

if (header) {

    const updateHeader = () => {
        header.classList.toggle("scrolled", window.scrollY > 30);
    };

    updateHeader();
    window.addEventListener("scroll", updateHeader, { passive: true });

}


/* =====================================================
   REVEAL ANIMATION
===================================================== */

const revealElements = document.querySelectorAll(
    ".section-heading, " +
    ".invitation-card, " +
    ".stat-card, " +
    ".website-browser, " +
    ".website-feature, " +
    ".video-card, " +
    ".style-card, " +
    ".feature-card, " +
    ".process-card, " +
    ".occasion-item, " +
    ".faq-item, " +
    ".enquiry-form"
);

if ("IntersectionObserver" in window) {

    const revealObserver = new IntersectionObserver(
        (entries, observer) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) {
                    return;
                }
                entry.target.classList.add("is-visible");
                observer.unobserve(entry.target);

                /* Drop the reveal transition so hover effects stay snappy */
                setTimeout(() => {
                    entry.target.classList.remove("reveal", "is-visible");
                }, 900);
            });
        },
        { threshold: 0.12 }
    );

    revealElements.forEach((element) => {
        element.classList.add("reveal");
        revealObserver.observe(element);
    });

}


/* =====================================================
   INVITATION STYLE FILTER
===================================================== */

const styleTabs = document.querySelectorAll(".style-tab");
const styleCards = document.querySelectorAll(".style-card");

styleTabs.forEach((tab) => {

    tab.addEventListener("click", () => {

        const selectedStyle = tab.dataset.style;

        styleTabs.forEach((item) => {
            const isActive = item === tab;
            item.classList.toggle("active", isActive);
            item.setAttribute("aria-pressed", String(isActive));
        });

        styleCards.forEach((card) => {
            const isMatch =
                selectedStyle === "all" ||
                card.dataset.category.split(" ").includes(selectedStyle);
            card.classList.toggle("hidden", !isMatch);

            /* Replay the pop-in animation */
            card.classList.remove("pop-in");
            if (isMatch) {
                void card.offsetWidth;
                card.classList.add("pop-in");
            }
        });

    });

});


/* =====================================================
   TRUST STATISTICS COUNTER
===================================================== */

const counters = document.querySelectorAll(".counter");

const animateCounter = (counter) => {

    const target = Number(counter.dataset.target);
    const duration = 1600;
    const startTime = performance.now();

    const updateCounter = (currentTime) => {

        const progress = Math.min((currentTime - startTime) / duration, 1);

        /* Ease-out: starts quickly and slows near the final number */
        const easedProgress = 1 - Math.pow(1 - progress, 3);

        counter.textContent = Math.floor(easedProgress * target).toLocaleString("en-IN");

        if (progress < 1) {
            requestAnimationFrame(updateCounter);
        } else {
            counter.textContent = target.toLocaleString("en-IN");
        }

    };

    requestAnimationFrame(updateCounter);

};

if (counters.length && "IntersectionObserver" in window) {

    const counterObserver = new IntersectionObserver(
        (entries, observer) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) {
                    return;
                }
                animateCounter(entry.target);
                observer.unobserve(entry.target);
            });
        },
        { threshold: 0.4 }
    );

    counters.forEach((counter) => counterObserver.observe(counter));

} else {

    counters.forEach((counter) => {
        counter.textContent = Number(counter.dataset.target).toLocaleString("en-IN");
    });

}


/* =====================================================
   MULTILINGUAL CUSTOMER TESTIMONIALS
===================================================== */

const languageTabs = document.querySelectorAll(".language-tab");
const testimonialGroups = document.querySelectorAll(".testimonial-group");

languageTabs.forEach((tab) => {

    tab.addEventListener("click", () => {

        const selectedLanguage = tab.dataset.language;

        languageTabs.forEach((item) => {
            const isActive = item === tab;
            item.classList.toggle("active", isActive);
            item.setAttribute("aria-selected", String(isActive));
        });

        testimonialGroups.forEach((group) => {
            group.classList.toggle(
                "active",
                group.dataset.language === selectedLanguage
            );
        });

    });

});


/* =====================================================
   VIDEOS — ONLY ONE PLAYS AT A TIME
===================================================== */

const videos = document.querySelectorAll(".invitation-video");

videos.forEach((video) => {

    /* Discourage saving: no right-click "Save video as…" or dragging */
    video.addEventListener("contextmenu", (event) => event.preventDefault());
    video.addEventListener("dragstart", (event) => event.preventDefault());

    video.addEventListener("play", () => {
        videos.forEach((other) => {
            if (other !== video) {
                other.pause();
            }
        });
    });
});


/* =====================================================
   LEAD LOGGING → GOOGLE SHEET
===================================================== */

/*
 * Fire-and-forget: sendBeacon keeps working even while the page is
 * opening WhatsApp or the mail app, and never blocks the visitor.
 */
const sendLead = (fields) => {

    if (!LEAD_ENDPOINT) {
        return;
    }

    const body = new URLSearchParams({
        ...fields,
        page: window.location.href
    });

    try {
        if (navigator.sendBeacon && navigator.sendBeacon(LEAD_ENDPOINT, body)) {
            return;
        }
    } catch (error) {
        /* Fall through to fetch */
    }

    fetch(LEAD_ENDPOINT, {
        method: "POST",
        mode: "no-cors",
        body
    }).catch(() => {});

};


/* Log clicks on the floating WhatsApp / Call buttons */

document.querySelectorAll(".contact-float-btn").forEach((button) => {
    button.addEventListener("click", () => {
        sendLead({
            type: "click",
            button: button.classList.contains("call-btn") ? "Call" : "WhatsApp"
        });
    });
});


/* =====================================================
   ENQUIRY FORM → WHATSAPP / EMAIL
===================================================== */

const enquiryForm = document.getElementById("enquiry-form");

if (enquiryForm) {

    const nameInput = enquiryForm.querySelector("#enq-name");
    const phoneInput = enquiryForm.querySelector("#enq-phone");
    const trapInput = enquiryForm.querySelector("#enq-website");
    const occasionSelect = enquiryForm.querySelector("#enq-occasion");
    const dateInput = enquiryForm.querySelector("#enq-date");
    const messageInput = enquiryForm.querySelector("#enq-message");
    const serviceInputs = enquiryForm.querySelectorAll('input[name="service"]');
    const errorMessage = enquiryForm.querySelector(".form-error");
    const emailLink = document.getElementById("enquiry-email");

    const formatDate = (value) => {
        if (!value) {
            return "";
        }
        const [year, month, day] = value.split("-");
        return `${day}/${month}/${year}`;
    };

    const selectedServices = () => [...serviceInputs]
        .filter((input) => input.checked)
        .map((input) => input.value);

    const buildMessage = () => {

        const services = selectedServices();

        const lines = [
            "Hi Libesole! I'd like to enquire about an invitation.",
            "",
            `Name: ${nameInput.value.trim()}`,
            `WhatsApp: ${phoneInput.value.trim()}`,
            `Occasion: ${occasionSelect.value}`
        ];

        if (dateInput.value) {
            lines.push(`Event date: ${formatDate(dateInput.value)}`);
        }

        if (services.length) {
            lines.push(`Interested in: ${services.join(", ")}`);
        }

        if (messageInput.value.trim()) {
            lines.push(`Details: ${messageInput.value.trim()}`);
        }

        return lines.join("\n");

    };

    /* At least 10 digits, allowing spaces, dashes and a leading + */
    const isValidPhone = (value) => value.replace(/\D/g, "").length >= 10;

    const validate = () => {

        const nameValid = nameInput.value.trim().length > 0;
        const phoneValid = isValidPhone(phoneInput.value);

        nameInput.setAttribute("aria-invalid", String(!nameValid));
        phoneInput.setAttribute("aria-invalid", String(!phoneValid));

        errorMessage.hidden = nameValid && phoneValid;

        if (!nameValid) {
            nameInput.focus();
        } else if (!phoneValid) {
            phoneInput.focus();
        }

        return nameValid && phoneValid;

    };

    [nameInput, phoneInput].forEach((input) => {
        input.addEventListener("input", () => {
            input.removeAttribute("aria-invalid");
            if (nameInput.value.trim() && isValidPhone(phoneInput.value)) {
                errorMessage.hidden = true;
            }
        });
    });

    const logEnquiry = (channel) => {

        /* Bots fill the hidden field; people never see it */
        if (trapInput && trapInput.value) {
            return;
        }

        sendLead({
            type: "enquiry",
            channel,
            name: nameInput.value.trim(),
            phone: phoneInput.value.trim(),
            occasion: occasionSelect.value,
            eventDate: formatDate(dateInput.value),
            services: selectedServices().join(", "),
            message: messageInput.value.trim()
        });

    };

    enquiryForm.addEventListener("submit", (event) => {

        event.preventDefault();

        if (!validate()) {
            return;
        }

        logEnquiry("WhatsApp");

        const url =
            `https://wa.me/${WHATSAPP_NUMBER}?text=` +
            encodeURIComponent(buildMessage());

        window.open(url, "_blank", "noopener");

    });

    if (emailLink) {
        emailLink.addEventListener("click", (event) => {

            if (!validate()) {
                event.preventDefault();
                return;
            }

            logEnquiry("Email");

            const subject = `Invitation enquiry: ${occasionSelect.value}`;

            emailLink.href =
                `mailto:${CONTACT_EMAIL}` +
                `?subject=${encodeURIComponent(subject)}` +
                `&body=${encodeURIComponent(buildMessage())}`;

        });
    }


    /* Pre-fill the form from occasion links and service buttons */

    document.querySelectorAll("[data-occasion]").forEach((link) => {
        link.addEventListener("click", () => {
            occasionSelect.value = link.dataset.occasion;
        });
    });

    document.querySelectorAll("a[data-service]").forEach((link) => {
        link.addEventListener("click", () => {
            serviceInputs.forEach((input) => {
                input.checked = input.value === link.dataset.service;
            });
        });
    });

    /* "Use this template" buttons */

    document.querySelectorAll("[data-template]").forEach((link) => {
        link.addEventListener("click", () => {

            const card = link.closest(".style-card");
            const category = card ? card.dataset.category : "";

            if (category.includes("birthday")) {
                occasionSelect.value = "Birthday";
            } else {
                occasionSelect.value = "Wedding";
            }

            messageInput.value = `I love the "${link.dataset.template}" template.`;

            enquiryForm.classList.remove("highlight");
            void enquiryForm.offsetWidth;
            enquiryForm.classList.add("highlight");

        });
    });

}


/* =====================================================
   SCROLL PROGRESS BAR
===================================================== */

const scrollProgress = document.querySelector(".scroll-progress");

if (scrollProgress) {

    const updateProgress = () => {
        const scrollable =
            document.documentElement.scrollHeight - window.innerHeight;
        const progress = scrollable > 0 ? window.scrollY / scrollable : 0;
        scrollProgress.style.transform = `scaleX(${progress})`;
    };

    updateProgress();
    window.addEventListener("scroll", updateProgress, { passive: true });

}


/* =====================================================
   FALLING PETALS (HERO)
===================================================== */

const petalContainer = document.querySelector(".petals");

if (petalContainer && !prefersReducedMotion) {

    const petalColours = [
        "linear-gradient(135deg, #ff5fa2, #e0337a)",
        "linear-gradient(135deg, #ffd166, #f7a928)",
        "linear-gradient(135deg, #ff9f6b, #ff6b2c)",
        "linear-gradient(135deg, #ffc2d6, #ff8fb8)",
        "linear-gradient(135deg, #fff3b0, #ffd23f)"
    ];

    const petalCount = window.innerWidth < 600 ? 12 : 22;

    for (let i = 0; i < petalCount; i += 1) {

        const petal = document.createElement("span");
        const size = 8 + Math.random() * 10;

        petal.className = "petal";
        petal.style.left = `${Math.random() * 100}%`;
        petal.style.width = `${size}px`;
        petal.style.height = `${size * 0.7}px`;
        petal.style.background =
            petalColours[Math.floor(Math.random() * petalColours.length)];
        petal.style.animationDuration = `${9 + Math.random() * 9}s`;
        petal.style.animationDelay = `${-Math.random() * 18}s`;

        petalContainer.appendChild(petal);

    }

}


/* =====================================================
   WEDDING WEBSITE COUNTDOWN
===================================================== */

const countdownParts = {
    days: document.getElementById("cd-days"),
    hours: document.getElementById("cd-hours"),
    mins: document.getElementById("cd-mins"),
    secs: document.getElementById("cd-secs")
};

if (countdownParts.days) {

    let weddingDate = new Date("2026-12-18T18:00:00+05:30");

    /* Keep the demo alive once the sample date has passed */
    if (weddingDate <= new Date()) {
        weddingDate = new Date(Date.now() + 45 * 24 * 60 * 60 * 1000);

        const previewDate = document.getElementById("preview-date");
        if (previewDate) {
            previewDate.textContent = weddingDate
                .toLocaleDateString("en-GB")
                .replace(/\//g, ".");
        }
    }

    const pad = (value) => String(value).padStart(2, "0");

    const updateCountdown = () => {

        const remaining = Math.max(0, weddingDate - Date.now());
        const seconds = Math.floor(remaining / 1000);

        countdownParts.days.textContent = pad(Math.floor(seconds / 86400));
        countdownParts.hours.textContent = pad(Math.floor((seconds % 86400) / 3600));
        countdownParts.mins.textContent = pad(Math.floor((seconds % 3600) / 60));
        countdownParts.secs.textContent = pad(seconds % 60);

    };

    updateCountdown();
    setInterval(updateCountdown, 1000);

}


/* =====================================================
   3D TILT ON TEMPLATE CARDS (MOUSE ONLY)
===================================================== */

if (
    !prefersReducedMotion &&
    window.matchMedia("(hover: hover) and (pointer: fine)").matches
) {

    document.querySelectorAll(".style-card, .invitation-card").forEach((card) => {

        card.addEventListener("mousemove", (event) => {
            const rect = card.getBoundingClientRect();
            const x = (event.clientX - rect.left) / rect.width - 0.5;
            const y = (event.clientY - rect.top) / rect.height - 0.5;

            card.style.transform =
                `perspective(800px) rotateX(${-y * 8}deg) rotateY(${x * 8}deg) translateY(-6px)`;
        });

        card.addEventListener("mouseleave", () => {
            card.style.transform = "";
        });

    });

}


/* =====================================================
   FOOTER YEAR
===================================================== */

const yearElement = document.getElementById("year");

if (yearElement) {
    yearElement.textContent = new Date().getFullYear();
}
