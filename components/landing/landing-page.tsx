"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { ArrowRight, ChevronRight, Users, Zap, Code, BookOpen, Github } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTheme } from "next-themes"

export function LandingPage() {
  const { theme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.3,
      },
    },
  }

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.5 },
    },
  }

  // Simulate pedestrian movement with canvas
  useEffect(() => {
    if (!mounted) return

    const canvas = document.getElementById("pedestrian-canvas") as HTMLCanvasElement
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas dimensions
    const resizeCanvas = () => {
      canvas.width = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
    }
    resizeCanvas()
    window.addEventListener("resize", resizeCanvas)

    // Pedestrian simulation
    const pedestrians: {
      x: number
      y: number
      vx: number
      vy: number
      radius: number
      color: string
    }[] = []

    // Create pedestrians
    const createPedestrians = () => {
      const count = Math.floor(canvas.width / 40) // Adjust density based on canvas width
      pedestrians.length = 0

      for (let i = 0; i < count; i++) {
        const radius = Math.random() * 2 + 2
        pedestrians.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 0.5,
          vy: (Math.random() - 0.5) * 0.5,
          radius,
          color: theme === "dark" ? "rgba(255, 255, 255, 0.5)" : "rgba(0, 0, 0, 0.5)",
        })
      }
    }

    createPedestrians()

    // Animation loop
    let animationId: number
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Draw and update pedestrians
      pedestrians.forEach((p) => {
        // Update position
        p.x += p.vx
        p.y += p.vy

        // Boundary check
        if (p.x < p.radius || p.x > canvas.width - p.radius) {
          p.vx *= -1
          p.x = Math.max(p.radius, Math.min(p.x, canvas.width - p.radius))
        }
        if (p.y < p.radius || p.y > canvas.height - p.radius) {
          p.vy *= -1
          p.y = Math.max(p.radius, Math.min(p.y, canvas.height - p.radius))
        }

        // Simple collision avoidance
        pedestrians.forEach((other) => {
          if (p === other) return

          const dx = other.x - p.x
          const dy = other.y - p.y
          const distance = Math.sqrt(dx * dx + dy * dy)
          const minDist = p.radius + other.radius + 5

          if (distance < minDist) {
            const angle = Math.atan2(dy, dx)
            const tx = p.x + Math.cos(angle) * minDist
            const ty = p.y + Math.sin(angle) * minDist
            const ax = (tx - other.x) * 0.05
            const ay = (ty - other.y) * 0.05

            p.vx -= ax
            p.vy -= ay
            other.vx += ax
            other.vy += ay
          }
        })

        // Draw pedestrian
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2)
        ctx.fillStyle = p.color
        ctx.fill()
      })

      animationId = requestAnimationFrame(animate)
    }

    animate()

    // Cleanup
    return () => {
      cancelAnimationFrame(animationId)
      window.removeEventListener("resize", resizeCanvas)
    }
  }, [mounted, theme])

  if (!mounted) return null

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero Section */}
      <section className="relative h-screen flex items-center overflow-hidden">
        {/* Background Canvas */}
        <canvas id="pedestrian-canvas" className="absolute inset-0 w-full h-full" style={{ opacity: 0.7 }}></canvas>

        {/* Content */}
        <div className="container mx-auto px-4 z-10">
          <motion.div variants={containerVariants} initial="hidden" animate="visible" className="max-w-3xl">
            <motion.div variants={itemVariants} className="flex items-center mb-6">
              <img
                src="https://sjc.microlink.io/8uW6gl6S0OTu4IFl1b-y6UesTUY2X8W63NM3Je8VePxaIZJuSNgoqF-K1IaG3lR6xPd1jcv-M_zniJHf0FPKWw.jpeg"
                alt="JuPedSim Logo"
                className="h-16 w-auto mr-4"
              />
              <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                JuPedSim Web
              </h1>
            </motion.div>

            <motion.h2 variants={itemVariants} className="text-2xl md:text-3xl font-medium mb-6">
              Web-based Pedestrian Dynamics Simulation Platform
            </motion.h2>

            <motion.p variants={itemVariants} className="text-lg mb-8 max-w-2xl text-muted-foreground">
              JuPedSim is a Python package with a C++ core designed to simulate pedestrian dynamics with high precision.
              This web interface makes these powerful simulation capabilities accessible to everyone.
            </motion.p>

            <motion.div variants={itemVariants} className="flex flex-wrap gap-4">
              <Link href="/simulation">
                <Button size="lg" className="gap-2 bg-blue-600 hover:bg-blue-700">
                  Get Started <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <a href="https://www.jupedsim.org/stable/" target="_blank" rel="noopener noreferrer">
                <Button size="lg" variant="outline" className="gap-2">
                  Documentation <BookOpen className="h-4 w-4" />
                </Button>
              </a>
            </motion.div>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
          animate={{ y: [0, 10, 0] }}
          transition={{ repeat: Number.POSITIVE_INFINITY, duration: 2 }}
        >
          <ChevronRight className="h-8 w-8 rotate-90 opacity-50" />
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-16">Key Features</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md"
            >
              <div className="bg-blue-100 dark:bg-blue-900 rounded-full p-3 w-12 h-12 flex items-center justify-center mb-6">
                <Users className="h-6 w-6 text-blue-600 dark:text-blue-300" />
              </div>
              <h3 className="text-xl font-semibold mb-4">Advanced Pedestrian Models</h3>
              <p className="text-muted-foreground">
                Choose from multiple scientifically validated pedestrian dynamics models including Collision-Free Speed,
                Social Force, and Generalized Centrifugal Force models.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              viewport={{ once: true }}
              className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md"
            >
              <div className="bg-green-100 dark:bg-green-900 rounded-full p-3 w-12 h-12 flex items-center justify-center mb-6">
                <Zap className="h-6 w-6 text-green-600 dark:text-green-300" />
              </div>
              <h3 className="text-xl font-semibold mb-4">Interactive Design Tools</h3>
              <p className="text-muted-foreground">
                Create complex environments with intuitive drawing tools. Design walkable areas, obstacles, start
                points, and exits with precision and ease.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              viewport={{ once: true }}
              className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md"
            >
              <div className="bg-purple-100 dark:bg-purple-900 rounded-full p-3 w-12 h-12 flex items-center justify-center mb-6">
                <Code className="h-6 w-6 text-purple-600 dark:text-purple-300" />
              </div>
              <h3 className="text-xl font-semibold mb-4">Real-time Simulation</h3>
              <p className="text-muted-foreground">
                Run simulations in real-time and visualize pedestrian movement. Adjust simulation parameters on-the-fly
                for different scenarios and conditions.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-16">Applications</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="flex flex-col"
            >
              <h3 className="text-2xl font-semibold mb-4">Research & Education</h3>
              <p className="text-muted-foreground mb-6">
                JuPedSim is used in research institutions worldwide for analyzing pedestrian flow and studying crowd
                dynamics. The web interface makes it accessible for educational purposes.
              </p>
              <ul className="space-y-2 mb-6">
                <li className="flex items-start">
                  <ChevronRight className="h-5 w-5 text-blue-600 mr-2 flex-shrink-0 mt-0.5" />
                  <span>Conduct experiments with different pedestrian models</span>
                </li>
                <li className="flex items-start">
                  <ChevronRight className="h-5 w-5 text-blue-600 mr-2 flex-shrink-0 mt-0.5" />
                  <span>Analyze crowd behavior in various scenarios</span>
                </li>
                <li className="flex items-start">
                  <ChevronRight className="h-5 w-5 text-blue-600 mr-2 flex-shrink-0 mt-0.5" />
                  <span>Validate theoretical models with simulation data</span>
                </li>
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="flex flex-col"
            >
              <h3 className="text-2xl font-semibold mb-4">Urban Planning & Safety</h3>
              <p className="text-muted-foreground mb-6">
                Optimize building layouts, plan emergency evacuations, and design public spaces with pedestrian flow
                simulation to ensure safety and efficiency.
              </p>
              <ul className="space-y-2 mb-6">
                <li className="flex items-start">
                  <ChevronRight className="h-5 w-5 text-blue-600 mr-2 flex-shrink-0 mt-0.5" />
                  <span>Test evacuation scenarios for buildings and public spaces</span>
                </li>
                <li className="flex items-start">
                  <ChevronRight className="h-5 w-5 text-blue-600 mr-2 flex-shrink-0 mt-0.5" />
                  <span>Optimize pedestrian flow in transportation hubs</span>
                </li>
                <li className="flex items-start">
                  <ChevronRight className="h-5 w-5 text-blue-600 mr-2 flex-shrink-0 mt-0.5" />
                  <span>Design safer urban environments with data-driven insights</span>
                </li>
              </ul>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">Ready to start simulating?</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto opacity-90">
            Experience the power of JuPedSim's pedestrian dynamics simulation in your browser.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/simulation">
              <Button size="lg" variant="secondary" className="gap-2">
                Launch Simulator <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <a href="https://github.com/jupedsim/jupedsim" target="_blank" rel="noopener noreferrer">
              <Button
                size="lg"
                variant="outline"
                className="gap-2 bg-transparent text-white border-white hover:bg-white/10"
              >
                <Github className="h-4 w-4" /> View on GitHub
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-gray-100 dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center mb-6 md:mb-0">
              <img
                src="https://sjc.microlink.io/8uW6gl6S0OTu4IFl1b-y6UesTUY2X8W63NM3Je8VePxaIZJuSNgoqF-K1IaG3lR6xPd1jcv-M_zniJHf0FPKWw.jpeg"
                alt="JuPedSim Logo"
                className="h-10 w-auto mr-3"
              />
              <div>
                <p className="font-semibold">JuPedSim Web</p>
                <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} JuPedSim Team</p>
              </div>
            </div>
            <div className="flex gap-6">
              <a
                href="https://www.jupedsim.org/stable/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Documentation
              </a>
              <a
                href="https://github.com/jupedsim/jupedsim"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                GitHub
              </a>
              <a
                href="https://www.jupedsim.org/stable/notebooks/index.html"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Tutorials
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
