import { useEffect, useRef } from "react";

const BackgroundEffects = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size
    const setCanvasSize = () => {
      if (!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    setCanvasSize();
    window.addEventListener("resize", setCanvasSize);

    // Particle class with TypeScript interface
    interface IParticle {
      x: number;
      y: number;
      size: number;
      speedX: number;
      speedY: number;
      color: string;
      update: () => void;
      draw: (context: CanvasRenderingContext2D) => void;
    }

    class Particle implements IParticle {
      x: number;
      y: number;
      size: number;
      speedX: number;
      speedY: number;
      color: string;

      constructor(canvasWidth: number, canvasHeight: number) {
        this.x = Math.random() * canvasWidth;
        this.y = Math.random() * canvasHeight;
        this.size = Math.random() * 3;
        this.speedX = Math.random() * 1 - 0.5;
        this.speedY = Math.random() * 1 - 0.5;
        this.color = `rgba(135, 206, 250, ${Math.random() * 0.4 + 0.1})`;
      }

      update() {
        const canvas = canvasRef.current;
        if (!canvas) return; // Return if canvas is null
        this.x += this.speedX;
        this.y += this.speedY;

        // Wrap around canvas if out of bounds
        if (this.x > canvas.width) this.x = 0;
        if (this.x < 0) this.x = canvas.width;
        if (this.y > canvas.height) this.y = 0;
        if (this.y < 0) this.y = canvas.height;
      }

      draw(context: CanvasRenderingContext2D) {
        context.fillStyle = this.color;
        context.beginPath();
        context.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        context.fill();
      }
    }

    // Image class to manage images with repetition effect
    class ImageItem {
      x: number;
      y: number;
      size: number;
      speedX: number;
      speedY: number;
      opacity: number;
      image: HTMLImageElement;
      direction: number;
      repetitions: number; // Track the number of times the image is drawn
      canvasWidth: number;
      canvasHeight: number;

      constructor(canvasWidth: number, canvasHeight: number, imageUrl: string) {
        this.image = new Image();
        this.image.src = imageUrl;

        // Random position and size
        this.size = Math.random() * 60 + 40; // Random size between 40 and 100
        this.x = Math.random() * canvasWidth;
        this.y = Math.random() * canvasHeight;
        this.speedX = Math.random() * 1 - 0.5;
        this.speedY = Math.random() * 1 - 0.5;
        this.opacity = Math.random() * 0.5 + 0.5; // Random opacity to simulate twinkling
        this.direction = Math.random() < 0.5 ? -1 : 1; // Random direction for opacity change
        this.repetitions = 1; // Start with 0 repetitions
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
      }

      // Check if the image collides with any other image
      checkCollision(otherImage: ImageItem): boolean {
        const dx = this.x - otherImage.x;
        const dy = this.y - otherImage.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        return distance < this.size / 2 + otherImage.size / 2;
      }

      // Update position and handle twinkling and repetitions
      update(images: ImageItem[]) {
        const canvas = canvasRef.current;
        if (!canvas) return; // Ensure canvas exists

        // Check if the image should stop after it has been repeated twice
        if (this.repetitions >= 2) {
          // If image has been repeated twice, reset position and repetition counter
          this.x = Math.random() * canvas.width;
          this.y = Math.random() * canvas.height;
          this.repetitions = 0; // Reset repetitions for next cycle
        }

        this.x += this.speedX;
        this.y += this.speedY;

        // Wrap around canvas if out of bounds
        if (this.x > canvas.width) this.x = 0;
        if (this.x < 0) this.x = canvas.width;
        if (this.y > canvas.height) this.y = 0;
        if (this.y < 0) this.y = canvas.height;

        // Twinkle effect by changing opacity
        this.opacity += this.direction * 0.01;
        if (this.opacity <= 0.2 || this.opacity >= 0.8) {
          this.direction *= -1;
        }

        // Ensure no overlap with other images
        for (let i = 0; i < images.length; i++) {
          if (images[i] !== this && this.checkCollision(images[i])) {
            // If collision happens, move the image to a random position
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
          }
        }

        // Track repetition: increase after first appearance
        if (this.repetitions === 0 && Math.random() < 0.01) {
          this.repetitions++; // Increment repetition after the first appearance
        }
      }

      draw(context: CanvasRenderingContext2D) {
        if (this.repetitions >= 2) return; // Skip drawing after 2 repetitions

        context.save();
        context.globalAlpha = this.opacity;
        context.filter = "blur(3px)"; // Apply slight blur
        context.drawImage(this.image, this.x, this.y, this.size, this.size);
        context.restore();
      }
    }

    // Image URLs to use
    const imageUrls = [
      "https://cryptologos.cc/logos/sui-sui-logo.png",
      "https://assets.crypto.ro/logos/sui-sui-logo.png",
      "https://cryptoast.fr/wp-content/uploads/2022/10/sui-logo-1.png",
      "https://s2.tokeninsight.com/static/coins/img/content/imgUrl/sui_logo.png",
    ];

    // Create image items
    const imageItems = imageUrls.map(
      (url) => new ImageItem(canvas.width, canvas.height, url)
    );

    // Create particles
    const particles: IParticle[] = Array.from(
      { length: 100 },
      () => new Particle(canvas.width, canvas.height)
    );

    // Animation loop
    let animationFrameId: number;

    const animate = () => {
      const canvas = canvasRef.current;
      if (!canvas || !ctx) return;

      // Clear the canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Apply background blur
      ctx.filter = "blur(3px)";

      // Draw particles
      particles.forEach((particle) => {
        particle.update();
        particle.draw(ctx);
      });

      // Draw images with twinkling and repetition effect
      imageItems.forEach((imageItem) => {
        imageItem.update(imageItems);
        imageItem.draw(ctx);
      });

      // Reset blur after drawing
      ctx.filter = "blur(0px)";

      // Request the next animation frame
      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    // Cleanup function
    return () => {
      window.removeEventListener("resize", setCanvasSize);
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 -z-10 bg-gradient-to-b from-[#0f172a] to-[#1a2b4a]"
    />
  );
};

export default BackgroundEffects;
