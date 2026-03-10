import {  useState } from 'react';
import { ThemeContext } from './ThemeContext';



export function ThemeProvider({ children }) {
    // Тема хранится локально, чтобы интерфейс не мигал при перезагрузке страницы.
    const [isDarkMode, setIsDarkMode] = useState(localStorage.getItem('isDarkMode') === 'true');
    const toggleTheme = () =>{
        const newMode = !isDarkMode
        setIsDarkMode(newMode);
        localStorage.setItem('isDarkMode', newMode);
       
}
 return <ThemeContext.Provider value={{ isDarkMode, toggleTheme }}>{children}</ThemeContext.Provider>
    }
