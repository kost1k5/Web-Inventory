import {  useState } from 'react';
import { ThemeContext } from './ThemeContext';



export function ThemeProvider({ children }) {
    // Тема хранится локально, чтобы интерфейс не мигал при перезагрузке страницы.
    const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
    const isDarkMode = theme === 'dark';

    const installTheme = (newTheme) => {
        setTheme(newTheme);
        localStorage.setItem('theme', newTheme);
    }
//     const toggleTheme = () =>{
//         const isLightMode = theme === 'light';
//         setTheme(isLightMode ? 'dark' : 'light');
//         localStorage.setItem('theme', isLightMode ? 'dark' : 'light'); 
// }


 return <ThemeContext.Provider value={{ installTheme, isDarkMode, theme}}>{children}
 </ThemeContext.Provider>
    }
