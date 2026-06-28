const StatCard = ({ title, value, color }) => {
  return (
    <div className="stat-card">
      <div
        className="stat-indicator"
        style={{ background: color }}
      ></div>

      <div>
        <h3>{title}</h3>
        <h1>{value}</h1>
      </div>
    </div>
  );
};

export default StatCard;