"use client"

import { useEffect, useState } from "react"

declare global {
    interface Window {
        google: any;
        googleTranslateElementInit: any;
    }
}

export function GoogleTranslate() {
    const [isLoaded, setIsLoaded] = useState(false)

    useEffect(() => {
        window.googleTranslateElementInit = () => {
            new window.google.translate.TranslateElement(
                {
                    pageLanguage: "en",
                    includedLanguages: "en,am", // English and Amharic
                    layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE,
                    autoDisplay: false,
                },
                "google_translate_element"
            )
            setIsLoaded(true)
        }

        const script = document.createElement("script")
        script.src = "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit"
        script.async = true
        document.body.appendChild(script)

        return () => {
            // Cleanup if needed, though Google Translate script is global
            // document.body.removeChild(script) 
        }
    }, [])

    return (
        <div className="fixed bottom-6 right-6 z-50">
            <div id="google_translate_element" className="google-translate-container shadow-lg rounded-xl overflow-hidden" />
            <style jsx global>{`
                .google-translate-container {
                    display: inline-block;
                    background-color: #111;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 12px;
                    padding: 0;
                }
                .goog-te-gadget-simple {
                    background-color: #111 !important;
                    border: none !important;
                    padding: 10px 16px !important;
                    border-radius: 12px !important;
                    font-size: 14px !important;
                    line-height: 20px !important;
                    display: flex !important;
                    align-items: center;
                    cursor: pointer;
                    transition: all 0.3s ease;
                }
                .goog-te-gadget-simple:hover {
                    background-color: #222 !important;
                }
                .goog-te-menu-value {
                    color: #fff !important;
                    display: flex !important;
                    align-items: center;
                    gap: 8px;
                }
                .goog-te-menu-value span {
                    color: #fff !important;
                    font-weight: 600 !important;
                    border-left: none !important;
                }
                .goog-te-menu-value span:first-child {
                    padding-right: 0 !important;
                }
                /* Hide the Google icon if possible or style it */
                .goog-te-gadget-icon {
                    display: none !important;
                }
                /* Add a custom icon via CSS if needed, or just rely on text */
                .goog-te-gadget-simple:before {
                    content: '🌐';
                    margin-right: 8px;
                    font-size: 16px;
                }
                .goog-te-menu-value img {
                    display: none !important;
                }
                .goog-tooltip {
                    display: none !important;
                }
                .goog-te-banner-frame.skiptranslate {
                    display: none !important;
                }
                body {
                    top: 0px !important;
                }
                /* Hide Google Translate Bar */
                .goog-te-banner-frame {
                    display: none !important;
                }
                #goog-gt-tt {
                    display: none !important;
                }
            `}</style>
        </div>
    )
}
