'use server';

/**
 * @fileOverview This file contains the AI-assisted input flow for invoice details.
 *
 * - aiAssistInput - A function that suggests names, payment types, and currency amounts based on previous entries and corrects spelling errors.
 * - AiAssistInputInput - The input type for the aiAssistInput function.
 * - AiAssistInputOutput - The return type for the aiAssistInput function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AiAssistInputInputSchema = z.object({
  inputText: z.string().describe('The input text for which suggestions and corrections are needed.'),
  previousEntries: z.array(z.object({
    name: z.string().optional(),
    paymentType: z.string().optional(),
    currencyAmount: z.number().optional(),
  })).optional().describe('An array of previous entries for the same recipient.'),
});
export type AiAssistInputInput = z.infer<typeof AiAssistInputInputSchema>;

const AiAssistInputOutputSchema = z.object({
  suggestedName: z.string().optional().describe('A suggested name based on previous entries.'),
  suggestedPaymentType: z.string().optional().describe('A suggested payment type based on previous entries.'),
  suggestedCurrencyAmount: z.number().optional().describe('A suggested currency amount based on previous entries.'),
  correctedText: z.string().optional().describe('The input text with spelling corrections.'),
});
export type AiAssistInputOutput = z.infer<typeof AiAssistInputOutputSchema>;

export async function aiAssistInput(input: AiAssistInputInput): Promise<AiAssistInputOutput> {
  return aiAssistInputFlow(input);
}

const prompt = ai.definePrompt({
  name: 'aiAssistInputPrompt',
  input: {schema: AiAssistInputInputSchema},
  output: {schema: AiAssistInputOutputSchema},
  prompt: `You are an AI assistant helping to fill out invoice details. Based on the input text and previous entries for the same recipient, suggest names, payment types, and currency amounts. Also, correct any spelling errors in the input text.

Input Text: {{{inputText}}}

Previous Entries: {{#if previousEntries}}{{#each previousEntries}}Name: {{name}}, Payment Type: {{paymentType}}, Currency Amount: {{currencyAmount}}{{#unless @last}}\n{{/unless}}{{/each}}{{else}}No previous entries{{/if}}

Suggestions and Corrections:
- Suggested Name: {{suggestedName}}
- Suggested Payment Type: {{suggestedPaymentType}}
- Suggested Currency Amount: {{suggestedCurrencyAmount}}
- Corrected Text: {{correctedText}}`,
});

const aiAssistInputFlow = ai.defineFlow(
  {
    name: 'aiAssistInputFlow',
    inputSchema: AiAssistInputInputSchema,
    outputSchema: AiAssistInputOutputSchema,
  },
  async input => {
    const {
      inputText,
      previousEntries,
    } = input;

    let suggestedName: string | undefined = undefined;
    let suggestedPaymentType: string | undefined = undefined;
    let suggestedCurrencyAmount: number | undefined = undefined;

    if (previousEntries && previousEntries.length > 0) {
      // Basic logic to suggest the most frequent values from previous entries
      const names = previousEntries.map(entry => entry.name).filter(name => name !== undefined) as string[];
      const paymentTypes = previousEntries.map(entry => entry.paymentType).filter(paymentType => paymentType !== undefined) as string[];
      const currencyAmounts = previousEntries.map(entry => entry.currencyAmount).filter(currencyAmount => currencyAmount !== undefined) as number[];

      if (names.length > 0) {
        suggestedName = names.sort((a, b) => names.filter(v => v === a).length - names.filter(v => v === b).length).pop();
      }

      if (paymentTypes.length > 0) {
        suggestedPaymentType = paymentTypes.sort((a, b) => paymentTypes.filter(v => v === a).length - paymentTypes.filter(v => v === b).length).pop();
      }

      if (currencyAmounts.length > 0) {
        suggestedCurrencyAmount = currencyAmounts.sort((a, b) => currencyAmounts.filter(v => v === a).length - currencyAmounts.filter(v => v === b).length).pop();
      }
    }

    const {output} = await prompt({
      ...input,
      suggestedName,
      suggestedPaymentType,
      suggestedCurrencyAmount,
      correctedText: inputText, // In a real application, you would use an actual spell correction API here
    });
    return output!;
  }
);
