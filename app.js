// Placeholder wiring for Junkz Shooter landing page
console.log('Junkz Shooter landing page loaded');

// Simple smooth scroll for navigation links
document.querySelectorAll('nav a').forEach(link => {
    link.addEventListener('click', function(e) {
        e.preventDefault();
        const targetId = this.getAttribute('href');
        const targetSection = document.querySelector(targetId);
        if (targetSection) {
            targetSection.scrollIntoView({ behavior: 'smooth' });
        }
    });
});

// Placeholder for future game logic
function initGame() {
    console.log('Game initialization placeholder');
}

// Auto-run on load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGame);
} else {
    initGame();
}