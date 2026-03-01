import { Banknote, Building2, Calendar, Mail, MapPin, Phone, User } from "lucide-react";
import { Card } from "../../common/ui/card";
import MetaItem from "@/components/focuswin/common/ui/meta-item";

function formatKRW(value: string | number): string {
  const n = typeof value === "string" ? parseFloat(value) : value;
  if (Number.isNaN(n)) return String(value);
  return new Intl.NumberFormat("ko-KR", { style: "currency", currency: "KRW", maximumFractionDigits: 0 }).format(n);
}

type Props = {
  clientName?: string | null;
  contactPerson?: string | null;
  clientPhone?: string | null;
  clientEmail?: string | null;
  location?: string | null;
  salePric?: string | number | null;
  visitedLabel: string;
};

export default function SalesLogMetaCard({ clientName, contactPerson, clientPhone, clientEmail, location, salePric, visitedLabel }: Props) {
  return (
    <Card>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {clientName && <MetaItem icon={Building2} label="고객사" value={clientName} tone="blue" />}
        {contactPerson && <MetaItem icon={User} label="담당자" value={contactPerson} tone="sky" />}
        <MetaItem icon={Calendar} label="방문일시" value={visitedLabel} tone="amber" />
        {location && <MetaItem icon={MapPin} label="장소" value={location} tone="violet" />}
        {salePric != null && <MetaItem icon={Banknote} label="금액" value={formatKRW(salePric)} tone="slate" />}
        {clientPhone && <MetaItem icon={Phone} label="연락처" value={clientPhone} tone="slate" />}
        {clientEmail && <MetaItem icon={Mail} label="이메일" value={clientEmail} tone="slate" />}
      </div>
    </Card>
  );
}