// 돈 표시. 망친 케이크로 돈이 음수가 될 수 있어서 "-$10"처럼 부호를 앞에 붙인다
export const formatMoney = (amount: number) => `${amount < 0 ? "-" : ""}$${Math.abs(amount).toLocaleString()}`;
