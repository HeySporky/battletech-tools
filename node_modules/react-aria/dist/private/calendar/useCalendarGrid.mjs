import {hookData as $9bac9bf03b87f160$export$653eddfc964b0f8a, useVisibleRangeDescription as $9bac9bf03b87f160$export$31afe65d91ef6e8} from "./utils.mjs";
import {mergeProps as $bbaa08b3cd72f041$export$9d1611c77c2fe928} from "../utils/mergeProps.mjs";
import {useDateFormatter as $60f33508b4cd9d3b$export$85fd5fdf27bacc79} from "../i18n/useDateFormatter.mjs";
import {useKeyboard as $8296dad1a4c5e0dc$export$8f71654801c2f7cd} from "../interactions/useKeyboard.mjs";
import {useLabels as $e8ac3c3f5d4bae7f$export$d6875122194c7b44} from "../utils/useLabels.mjs";
import {useLocale as $2eb8e6d23f3d0cb0$export$43bb16f9c6d9e3f7} from "../i18n/I18nProvider.mjs";
import {startOfWeek as $aLm0I$startOfWeek, today as $aLm0I$today} from "@internationalized/date";
import {useMemo as $aLm0I$useMemo} from "react";

/*
 * Copyright 2020 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */ 







function $2d54ee2ec11ddab8$export$cb95147730a423f5(props, state) {
    let { startDate: startDate = state.visibleRange.start, endDate: endDate = state.visibleRange.end, firstDayOfWeek: firstDayOfWeek } = props;
    let { direction: direction } = (0, $2eb8e6d23f3d0cb0$export$43bb16f9c6d9e3f7)();
    let { keyboardProps: keyboardProps } = (0, $8296dad1a4c5e0dc$export$8f71654801c2f7cd)({
        shortcuts: {
            End: ()=>{
                state.focusSectionEnd();
            },
            Home: ()=>{
                state.focusSectionStart();
            },
            Escape: ()=>{
                // Cancel the selection.
                if ('setAnchorDate' in state) state.setAnchorDate(null);
                return false; // TODO: is this really correct? or should it return true when we cancel and only propagate if there's nothing to do
            }
        }
    });
    let { keyboardProps: repeatKeyboardProps } = (0, $8296dad1a4c5e0dc$export$8f71654801c2f7cd)({
        shortcuts: {
            Enter: ()=>{
                state.selectFocusedDate();
            },
            ' ': ()=>{
                state.selectFocusedDate();
            },
            PageUp: ()=>{
                state.focusPreviousSection();
            },
            'Shift+PageUp': ()=>{
                state.focusPreviousSection(true);
            },
            PageDown: ()=>{
                state.focusNextSection();
            },
            'Shift+PageDown': ()=>{
                state.focusNextSection(true);
            },
            ArrowLeft: ()=>{
                if (direction === 'rtl') state.focusNextDay();
                else state.focusPreviousDay();
            },
            ArrowUp: ()=>{
                state.focusPreviousRow();
            },
            ArrowRight: ()=>{
                if (direction === 'rtl') state.focusPreviousDay();
                else state.focusNextDay();
            },
            ArrowDown: ()=>{
                state.focusNextRow();
            }
        },
        allowRepeats: true
    });
    let visibleRangeDescription = (0, $9bac9bf03b87f160$export$31afe65d91ef6e8)(startDate, endDate, state.timeZone, true);
    let { ariaLabel: ariaLabel, ariaLabelledBy: ariaLabelledBy } = (0, $9bac9bf03b87f160$export$653eddfc964b0f8a).get(state);
    let labelProps = (0, $e8ac3c3f5d4bae7f$export$d6875122194c7b44)({
        'aria-label': [
            ariaLabel,
            visibleRangeDescription
        ].filter(Boolean).join(', '),
        'aria-labelledby': ariaLabelledBy
    });
    let dayFormatter = (0, $60f33508b4cd9d3b$export$85fd5fdf27bacc79)({
        weekday: props.weekdayStyle || 'narrow',
        timeZone: state.timeZone
    });
    let { locale: locale } = (0, $2eb8e6d23f3d0cb0$export$43bb16f9c6d9e3f7)();
    let weekDays = (0, $aLm0I$useMemo)(()=>{
        let isDayView = state.visibleDuration.days && state.visibleDuration.days < 7;
        let weekStart = isDayView ? startDate : (0, $aLm0I$startOfWeek)((0, $aLm0I$today)(state.timeZone), locale, firstDayOfWeek);
        let days = isDayView ? state.visibleDuration.days : 7;
        return [
            ...new Array(days).keys()
        ].map((index)=>{
            let date = weekStart.add({
                days: index
            });
            let dateDay = date.toDate(state.timeZone);
            return dayFormatter.format(dateDay);
        });
    }, [
        locale,
        state.timeZone,
        dayFormatter,
        firstDayOfWeek,
        startDate,
        state.visibleDuration.days
    ]);
    let weeksInMonth = state.getWeeksInMonth(startDate);
    return {
        gridProps: (0, $bbaa08b3cd72f041$export$9d1611c77c2fe928)(labelProps, {
            role: 'grid',
            'aria-readonly': state.isReadOnly || undefined,
            'aria-disabled': state.isDisabled || undefined,
            'aria-multiselectable': 'highlightedRange' in state || state.selectionMode === 'multiple' || undefined,
            onFocus: ()=>state.setFocused(true),
            onBlur: ()=>state.setFocused(false)
        }, keyboardProps, repeatKeyboardProps),
        headerProps: {
            // Column headers are hidden to screen readers to make navigating with a touch screen reader easier.
            // The day names are already included in the label of each cell, so there's no need to announce them twice.
            'aria-hidden': true
        },
        weekDays: weekDays,
        weeksInMonth: weeksInMonth
    };
}


export {$2d54ee2ec11ddab8$export$cb95147730a423f5 as useCalendarGrid};
//# sourceMappingURL=useCalendarGrid.mjs.map
