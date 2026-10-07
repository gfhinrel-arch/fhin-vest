// Narration for the 60s FhinVest video. One line per scene, timed to the scene cuts
// (duration=60 -> cut(x) = x/3 seconds). Keep each line short enough to fit its window.

export type Line = {id: string; text: string; at: number};

// at = seconds when the line should start (matches the scene)
export const SHORT: Line[] = [
  {id: 'n1', at: 0.4, text: 'Ask about an Indonesian stock, and you get an answer that sounds sure.'},
  {id: 'n2', at: 4.4, text: 'But there are no numbers you can check.'},
  {id: 'n3', at: 6.4, text: 'The real data is hidden behind filters, field names, and thousands of listings.'},
  {id: 'n4', at: 11.6, text: 'Most people give up, and accept a guess.'},
  {id: 'n5', at: 14.4, text: 'Fhin VEST is a research assistant, not a chatbot.'},
  {id: 'n6', at: 17.8, text: 'One source of data. The Sectors Financial API. Nothing else.'},
  {id: 'n7', at: 22.1, text: 'Ask which banks return over fifteen percent on equity.'},
  {id: 'n8', at: 25.6, text: 'The agent picks the right tool, and answers with the exact figures.'},
  {id: 'n9', at: 29.8, text: 'One credit, not three. Every tool it runs is visible on screen.'},
  {id: 'n10', at: 34.4, text: 'Then a full company breakdown, every ratio labelled with its period.'},
  {id: 'n11', at: 42.1, text: 'Four tools. One data source. One rule about honesty.'},
  {id: 'n12', at: 46.0, text: 'It will not tell you what to buy. It cannot place an order.'},
  {id: 'n13', at: 50.8, text: 'Here is how you use it. Open the screener.'},
  {id: 'n14', at: 53.5, text: 'Filter the market by real numbers.'},
  {id: 'n15', at: 56.0, text: 'Then open a company and read the ratios. Fhin VEST.'},
];
