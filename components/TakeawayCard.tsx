interface TakeawayCardProps {
  title: string;
  detail: string;
  action: string;
}

export default function TakeawayCard({ title, detail, action }: TakeawayCardProps) {
  return (
    <article className="takeaway-card">
      <h3>{title}</h3>
      <p>{detail}</p>
      <p className="takeaway-action">建议行动：{action}</p>
    </article>
  );
}
