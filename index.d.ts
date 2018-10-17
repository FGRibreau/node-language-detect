declare module 'languagedetect' {
    export type Probabilities = [ string, number ];

    /**
     * LanguageDetect is a port of the PEAR::Text_LanguageDetect that can
     * identify human languages from text samples and return confidence
     * scores for each.
     */
    export default class LanguageDetect {
        /**
         * No parameters required
         */
        constructor();

        /**
         * Detects the closeness of a sample of text to the known languages
         * 
         * @param sample The text to run the detection
         * @param limit Max number of matches
         * @example
         * detect('This is a test');
         * @returns All sorted matches language with its matching score
         */
        detect(sample: string, limit?: number): Probabilities[];

        /**
         * List of detectable languages
         * 
         * @example
         * getLanguages();
         * @returns All supported languages
         */
        getLanguages(): string[];

        /**
         * Number of languages that the lib can detect
         * 
         * @example
         * getLanguageCount();
         * @returns How many languages are supported
         */
        getLanguageCount(): number;
    }
}
