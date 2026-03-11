'use client';

import React from 'react';
import { PhoneInput } from 'react-international-phone';
import 'react-international-phone/style.css';

/**
 * A simple component to display a phone number with its country flag.
 * It uses PhoneInput in a read-only/disabled state to handle flag resolution.
 */
const PhoneDisplay = ({ phone, className = "" }) => {
    if (!phone) return <span className="text-slate-400">N/A</span>;

    return (
        <div className={`phone-display-minimal ${className}`}>
            <PhoneInput
                value={phone}
                readOnly
                disabled
                inputClassName="!bg-transparent !border-none !p-0 !text-sm !text-slate-600 !font-medium !h-auto !w-auto !min-w-0"
                countrySelectorStyleProps={{
                    buttonClassName: "!bg-transparent !border-none !p-0 !h-auto !cursor-default",
                    buttonContentClassName: "!p-0"
                }}
                containerClassName="!border-none !bg-transparent !gap-2 !items-center"
            />
            <style jsx global>{`
                .phone-display-minimal .react-international-phone-input-container {
                    border: none !important;
                }
                .phone-display-minimal .react-international-phone-country-selector-button__dropdown-arrow {
                    display: none !important;
                }
                .phone-display-minimal .react-international-phone-input {
                    cursor: default !important;
                    user-select: all !important;
                }
            `}</style>
        </div>
    );
};

export default PhoneDisplay;
