import { Building2, Calendar, MapPin, User } from "lucide-react";
import FwCard from "@/components/focuswin/card";
import FwMetaItem from "@/components/focuswin/meta-item";

type Props = {
  clientName?: string | null;
  contactPerson?: string | null;
  location?: string | null;
  visitedLabel: string;
};

export default function SalesLogMetaCard({ clientName, contactPerson, location, visitedLabel }: Props) {
  return (
    <FwCard>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {clientName && <FwMetaItem icon={Building2} label="고객사" value={clientName} tone="blue" />}
        {contactPerson && <FwMetaItem icon={User} label="담당자" value={contactPerson} tone="sky" />}
        <FwMetaItem icon={Calendar} label="방문일시" value={visitedLabel} tone="amber" />
        {location && <FwMetaItem icon={MapPin} label="장소" value={location} tone="violet" />}
      </div>
    </FwCard>
  );
}