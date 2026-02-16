import {  useState } from 'react';
import { ThemeContext } from './ThemeContext';



export function ThemeProvider({ children }) {
    const [isDarkMode, setIsDarkMode] = useState(localStorage.getItem('isDarkMode') === 'true');
    const toggleTheme = () =>{
        const newMode = !isDarkMode
        setIsDarkMode(newMode);
        localStorage.setItem('isDarkMode', newMode);
       
}
 return <ThemeContext.Provider value={{ isDarkMode, toggleTheme }}>{children}</ThemeContext.Provider>
    }
