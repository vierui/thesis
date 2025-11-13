import { useState, useEffect } from "react";

// export const useTheme = () => {
//   const [theme, setTheme] = useState(() => {
//     if (typeof window !== "undefined") {
//       return localStorage.getItem("theme") || "light";
//     }
//     return "light";
//   });

//   useEffect(() => {
//     if (theme === "dark") {
//       document.documentElement.classList.add("dark");
//     } else {
//       document.documentElement.classList.remove("dark");
//     }
//     localStorage.setItem("theme", theme);
//   }, [theme]);

//   const toggleTheme = () => {
//     setTheme((prevTheme) => (prevTheme === "light" ? "dark" : "light"));
//   };

//   return { theme, toggleTheme };
// };

export const useTheme = () => {
  // Initialize theme with null or a default for SSR.
  // We'll determine the true theme on the client.
  const [theme, setTheme] = useState<string | null>(null);

  useEffect(() => {
    // This code ONLY runs on the client (browser) after initial render.
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    // Determine the theme based on saved preference or system preference
    let initialTheme: string;
    if (savedTheme) {
      initialTheme = savedTheme;
    } else if (prefersDark) {
      initialTheme = 'dark';
    } else {
      initialTheme = 'light';
    }

    // Set the theme state
    setTheme(initialTheme);

    // Apply the 'dark' class to the html element
    document.documentElement.classList.toggle('dark', initialTheme === 'dark');

  }, []); // Empty dependency array means this runs once on mount.

  // This useEffect ensures the 'dark' class is updated whenever 'theme' state changes
  useEffect(() => {
    if (theme !== null) { // Only apply if theme has been initialized
      document.documentElement.classList.toggle('dark', theme === 'dark');
      localStorage.setItem('theme', theme); // Keep localStorage updated
    }
  }, [theme]);


  const toggleTheme = () => {
    setTheme(prevTheme => {
      const newTheme = prevTheme === 'light' ? 'dark' : 'light';
      return newTheme;
    });
  };

  return { theme, toggleTheme };
};
