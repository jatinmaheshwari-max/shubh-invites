/* =====================================================
   SHUBH INVITES
   MAIN JAVASCRIPT
===================================================== */


/* =====================================================
   MOBILE MENU
===================================================== */

const menuToggle = document.querySelector(".menu-toggle");
const mobileNav = document.querySelector(".mobile-nav");
const mobileLinks = document.querySelectorAll(".mobile-nav a");


if (menuToggle && mobileNav) {

    menuToggle.addEventListener("click", () => {

        const isOpen =
            mobileNav.classList.toggle("active");

        menuToggle.setAttribute(
            "aria-expanded",
            isOpen
        );

    });


    /*
     * Close mobile menu after
     * clicking a navigation link.
     */

    mobileLinks.forEach((link) => {

        link.addEventListener("click", () => {

            mobileNav.classList.remove("active");

            menuToggle.setAttribute(
                "aria-expanded",
                "false"
            );

        });

    });

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

