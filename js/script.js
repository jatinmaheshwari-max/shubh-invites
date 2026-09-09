/* =====================================================
   SHUBH INVITES
   MAIN JAVASCRIPT
===================================================== */


/* =====================================================
   MOBILE MENU
===================================================== */

const menuToggle =
    document.querySelector(".menu-toggle");

const mobileNav =
    document.querySelector(".mobile-nav");

const mobileLinks =
    document.querySelectorAll(".mobile-nav a");


if (menuToggle && mobileNav) {

    const closeMobileMenu = () => {

        mobileNav.classList.remove("active");

        menuToggle.setAttribute(
            "aria-expanded",
            "false"
        );

        menuToggle.setAttribute(
            "aria-label",
            "Open navigation menu"
        );

    };


    const openMobileMenu = () => {

        mobileNav.classList.add("active");

        menuToggle.setAttribute(
            "aria-expanded",
            "true"
        );

        menuToggle.setAttribute(
            "aria-label",
            "Close navigation menu"
        );

    };


    menuToggle.addEventListener(
        "click",
        () => {

            const isOpen =
                mobileNav.classList.contains("active");

            if (isOpen) {
                closeMobileMenu();
            } else {
                openMobileMenu();
            }

        }
    );


    mobileLinks.forEach((link) => {

        link.addEventListener(
            "click",
            closeMobileMenu
        );

    });


    /* Close with Escape */

    document.addEventListener(
        "keydown",
        (event) => {

            if (
                event.key === "Escape" &&
                mobileNav.classList.contains("active")
            ) {

                closeMobileMenu();

                menuToggle.focus();

            }

        }
    );

}


/* =====================================================
   CLOSE MENU WHEN CLICKING OUTSIDE
===================================================== */

document.addEventListener("click", (event) => {

    if (!menuToggle || !mobileNav) {
        return;
    }

    const clickedInsideMenu =
        mobileNav.contains(event.target);

    const clickedToggle =
        menuToggle.contains(event.target);

    if (
        !clickedInsideMenu &&
        !clickedToggle &&
        mobileNav.classList.contains("active")
    ) {

        mobileNav.classList.remove("active");

        menuToggle.setAttribute(
            "aria-expanded",
            "false"
        );

    }

});


/* =====================================================
   HEADER SCROLL EFFECT
===================================================== */

const header = document.querySelector(".site-header");


window.addEventListener(
    "scroll",
    () => {

        if (!header) {
            return;
        }

        if (window.scrollY > 30) {

            header.classList.add("scrolled");

        } else {

            header.classList.remove("scrolled");

        }

    },
    {
        passive: true
    }
);


/* =====================================================
   SIMPLE REVEAL ANIMATION
===================================================== */

const revealElements = document.querySelectorAll(
    ".service-card, " +
    ".invitation-card, " +
    ".feature-card, " +
    ".process-card, " +
    ".occasion-item"
);


if ("IntersectionObserver" in window) {

    const observer = new IntersectionObserver(
        (entries, observerInstance) => {

            entries.forEach((entry) => {

                if (!entry.isIntersecting) {
                    return;
                }

                entry.target.classList.add(
                    "is-visible"
                );

                observerInstance.unobserve(
                    entry.target
                );

            });

        },
        {
            threshold: 0.12
        }
    );


    revealElements.forEach((element) => {

        element.classList.add("reveal");

        observer.observe(element);

    });

}


/* =====================================================
   PREVENT ACCIDENTAL EMPTY LINKS
===================================================== */

document.querySelectorAll(
    'a[href="#"]'
).forEach((link) => {

    link.addEventListener("click", (event) => {

        event.preventDefault();

    });

});

/* =====================================================
   INVITATION STYLE FILTER
===================================================== */

const styleTabs = document.querySelectorAll(".style-tab");
const styleCards = document.querySelectorAll(".style-card");


styleTabs.forEach((tab) => {

    tab.addEventListener("click", () => {

        const selectedStyle =
            tab.dataset.style;


        /* Update active tab */

        styleTabs.forEach((item) => {

            item.classList.remove("active");

        });

        tab.classList.add("active");


        /* Filter cards */

        styleCards.forEach((card) => {

            const cardCategory =
                card.dataset.category;


            if (
                selectedStyle === "all" ||
                cardCategory === selectedStyle
            ) {

                card.classList.remove("hidden");

            } else {

                card.classList.add("hidden");

            }

        });

    });

});

/* =====================================================
   TRUST STATISTICS COUNTER
===================================================== */

const counters = document.querySelectorAll(".counter");


const animateCounter = (counter) => {

    const target = Number(
        counter.dataset.target
    );

    const duration = 1600;

    const startTime = performance.now();


    const updateCounter = (currentTime) => {

        const elapsed =
            currentTime - startTime;

        const progress =
            Math.min(
                elapsed / duration,
                1
            );


        /*
         * Ease-out animation
         * Starts quickly and slows down
         * near the final number.
         */

        const easedProgress =
            1 - Math.pow(
                1 - progress,
                3
            );


        const currentValue =
            Math.floor(
                easedProgress * target
            );


        counter.textContent =
            currentValue.toLocaleString();


        if (progress < 1) {

            requestAnimationFrame(
                updateCounter
            );

        } else {

            counter.textContent =
                target.toLocaleString();

        }

    };


    requestAnimationFrame(
        updateCounter
    );

};


/* -----------------------------------------------------
   Start counters only when visible
----------------------------------------------------- */

if (
    counters.length &&
    "IntersectionObserver" in window
) {

    const counterObserver =
        new IntersectionObserver(
            (entries, observer) => {

                entries.forEach((entry) => {

                    if (
                        !entry.isIntersecting
                    ) {
                        return;
                    }


                    const counter =
                        entry.target;


                    if (
                        counter.dataset.started
                    ) {
                        return;
                    }


                    counter.dataset.started =
                        "true";


                    animateCounter(
                        counter
                    );


                    observer.unobserve(
                        counter
                    );

                });

            },
            {
                threshold: 0.4
            }
        );


    counters.forEach((counter) => {

        counterObserver.observe(
            counter
        );

    });

}

/* =====================================================
   MULTILINGUAL CUSTOMER TESTIMONIALS
===================================================== */

const languageTabs =
    document.querySelectorAll(".language-tab");

const testimonialGroups =
    document.querySelectorAll(".testimonial-group");


if (
    languageTabs.length &&
    testimonialGroups.length
) {

    languageTabs.forEach((tab) => {

        tab.addEventListener("click", () => {

            const selectedLanguage =
                tab.dataset.language;


            /* -----------------------------------------
               UPDATE LANGUAGE TABS
            ----------------------------------------- */

            languageTabs.forEach((item) => {

                const isActive =
                    item === tab;

                item.classList.toggle(
                    "active",
                    isActive
                );

                item.setAttribute(
                    "aria-selected",
                    String(isActive)
                );

            });


            /* -----------------------------------------
               UPDATE TESTIMONIAL GROUP
            ----------------------------------------- */

            testimonialGroups.forEach((group) => {

                const isSelected =
                    group.dataset.language ===
                    selectedLanguage;

                group.classList.toggle(
                    "active",
                    isSelected
                );

            });

        });

    });

}