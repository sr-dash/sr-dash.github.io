const canvas = document.getElementById('ambient-grid-canvas');
if (canvas) {
    const ctx = canvas.getContext('2d');
    let points = [];
    const numPoints = 45; 
    let mouse = { x: null, y: null };

    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    window.addEventListener('resize', resize);
    resize();

    window.addEventListener('mousemove', (e) => { mouse.x = e.clientX; mouse.y = e.clientY; });
    window.addEventListener('mouseleave', () => { mouse.x = null; mouse.y = null; });

    // Populate matrix coordinate array
    for (let i = 0; i < numPoints; i++) {
        points.push({ 
            x: Math.random() * canvas.width, 
            y: Math.random() * canvas.height, 
            vx: (Math.random() - 0.5) * 0.4, 
            vy: (Math.random() - 0.5) * 0.4 
        });
    }

    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // 1. ACTIVE CONDITION CONTROLLER
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        
        // Dark Mode: Signature Gold Accent
        // Light Mode: Solid Indigo/Navy Slate tint with deep baseline visibility
        const nodeColor = isDark ? 'rgba(255, 170, 0, 0.65)' : 'rgba(30, 41, 59, 0.4)';
        const baselineLineColor = isDark ? '255, 170, 0' : '30, 41, 59';
        
        // Scaled thresholds specifically tuned to contrast against pure white layouts
        const baseOpacityThreshold = isDark ? 0.08 : 0.15; 
        const interactionMultiplier = isDark ? 0.18 : 0.25;

        // Render network vertex locations
        points.forEach(p => {
            p.x += p.vx; p.y += p.vy;
            if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
            if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
            
            ctx.beginPath(); 
            // Nodes are drawn slightly thicker in light mode to maintain presence
            ctx.arc(p.x, p.y, isDark ? 2.5 : 3.0, 0, Math.PI * 2); 
            ctx.fillStyle = nodeColor; 
            ctx.fill();
        });

        // Track and compute proximity vectors
        for (let i = 0; i < numPoints; i++) {
            for (let j = i + 1; j < numPoints; j++) {
                const dist = Math.hypot(points[i].x - points[j].x, points[i].y - points[j].y);
                
                if (dist < 180) { 
                    let opacity = (1 - (dist / 180)) * baseOpacityThreshold; 
                    
                    // Mouse proximity tracker
                    if (mouse.x !== null && mouse.y !== null) {
                        if (Math.hypot(mouse.x - points[i].x, mouse.y - points[i].y) < 200 || 
                            Math.hypot(mouse.x - points[j].x, mouse.y - points[j].y) < 200) {
                            opacity += interactionMultiplier; 
                        }
                    }
                    
                    if (opacity > 0) {
                        ctx.beginPath(); 
                        ctx.moveTo(points[i].x, points[i].y); 
                        ctx.lineTo(points[j].x, points[j].y);
                        
                        // Line widths configured to stand out against high light reflections
                        ctx.lineWidth = opacity > 0.15 ? 1.2 : 0.7; 
                        ctx.strokeStyle = `rgba(${baselineLineColor}, ${opacity})`; 
                        ctx.stroke();
                    }
                }
            }
        }
        requestAnimationFrame(animate);
    }
    animate();
}