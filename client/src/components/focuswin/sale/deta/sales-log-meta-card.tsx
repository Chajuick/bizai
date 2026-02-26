import { Building2, Calendar, MapPin, User } from "lucide-react";
import { Card } from "../../common/ui/card";
import MetaItem from "@/components/focuswin/common/ui/meta-item";

type Props = {
  clientName?: string | null;
  contactPerson?: string | null;
  location?: string | null;
  visitedLabel: string;
};

export default function SalesLogMetaCard({ clientName, contactPerson, location, visitedLabel }: Props) {
  return (
    <Card>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {clientName && <MetaItem icon={Building2} label="고객사" value={clientName} tone="blue" />}
        {contactPerson && <MetaItem icon={User} label="담당자" value={contactPerson} tone="sky" />}
        <MetaItem icon={Calendar} label="방문일시" value={visitedLabel} tone="amber" />
        {location && <MetaItem icon={MapPin} label="장소" value={location} tone="violet" />}
      </div>
    </Card>
  );
}