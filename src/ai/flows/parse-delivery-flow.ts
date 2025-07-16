'use server';
/**
 * @fileOverview An AI flow to parse a string of text into structured delivery data.
 *
 * - parseDeliveryInfo - A function that handles parsing the delivery command.
 * - DeliveryParseInput - The input type for the parseDeliveryInfo function.
 * - DeliveryParseOutput - The return type for the parseDeliveryInfo function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const DeliveryParseInputSchema = z.object({
    command: z.string().describe('The voice command to parse.'),
});
export type DeliveryParseInput = z.infer<typeof DeliveryParseInputSchema>;

const DeliveryParseOutputSchema = z.object({
    name: z.string().describe("The full name of the user mentioned in the command."),
    bottles: z.number().describe("The number of bottles mentioned in the command."),
});
export type DeliveryParseOutput = z.infer<typeof DeliveryParseOutputSchema>;

export async function parseDeliveryInfo(input: DeliveryParseInput): Promise<DeliveryParseOutput> {
    return parseDeliveryFlow(input);
}

const prompt = ai.definePrompt({
    name: 'parseDeliveryPrompt',
    input: { schema: DeliveryParseInputSchema },
    output: { schema: DeliveryParseOutputSchema },
    prompt: `You are an expert at parsing unstructured text into structured data. Your task is to extract the user's name and the number of bottles from the following command. The name might be multiple words.

Command: {{{command}}}

Extract the full name and the quantity of bottles.
For example, if the command is "Mohammad Fabiha 2 bottles", the name is "Mohammad Fabiha" and the bottles are 2.
If the command is "Ali 5 bottles", the name is "Ali" and the bottles are 5.`,
});

const parseDeliveryFlow = ai.defineFlow(
    {
        name: 'parseDeliveryFlow',
        inputSchema: DeliveryParseInputSchema,
        outputSchema: DeliveryParseOutputSchema,
    },
    async (input) => {
        const { output } = await prompt(input);
        if (!output) {
            throw new Error("Could not parse the command.");
        }
        return output;
    }
);
