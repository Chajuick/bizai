import { useState } from "react";
import { useLocation, useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export type ContactFormState = {
  cont_name: string;
  cont_role: string;
  cont_tele: string;
  cont_mail: string;
  cont_memo: string;
  main_yesn: boolean;
};

const emptyContactForm = (): ContactFormState => ({
  cont_name: "",
  cont_role: "",
  cont_tele: "",
  cont_mail: "",
  cont_memo: "",
  main_yesn: false,
});

export function useClientDetailViewModel() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();

  const clientId = Number(id);
  const utils = trpc.useUtils();

  const clientQuery = trpc.crm.client.get.useQuery({ clie_idno: clientId });
  const logsQuery = trpc.crm.sale.list.useQuery({ clie_idno: clientId });
  const ordersQuery = trpc.crm.order.list.useQuery(undefined);
  const contactsQuery = trpc.crm.client.contact.list.useQuery({ clie_idno: clientId });

  const createContactMutation = trpc.crm.client.contact.create.useMutation();
  const updateContactMutation = trpc.crm.client.contact.update.useMutation();
  const deleteContactMutation = trpc.crm.client.contact.delete.useMutation();

  const [showContactForm, setShowContactForm] = useState(false);
  const [editingContactId, setEditingContactId] = useState<number | null>(null);
  const [contactForm, setContactForm] = useState<ContactFormState>(emptyContactForm());

  const orders = ordersQuery.data?.items ?? [];

  const totalOrderAmount =
    orders
      .filter((o) => o.clie_idno === clientId && o.stat_code !== "canceled")
      .reduce((sum, o) => sum + Number(o.orde_pric || 0), 0) ?? 0;

  const openNewContact = () => {
    setEditingContactId(null);
    setContactForm(emptyContactForm());
    setShowContactForm(true);
  };

  const openEditContact = (cont: NonNullable<typeof contactsQuery.data>[number]) => {
    setEditingContactId(cont.cont_idno);
    setContactForm({
      cont_name: cont.cont_name,
      cont_role: cont.cont_role ?? "",
      cont_tele: cont.cont_tele ?? "",
      cont_mail: cont.cont_mail ?? "",
      cont_memo: cont.cont_memo ?? "",
      main_yesn: cont.main_yesn,
    });
    setShowContactForm(true);
  };

  const closeContactForm = () => {
    setShowContactForm(false);
    setEditingContactId(null);
  };

  const invalidateContacts = () =>
    utils.crm.client.contact.list.invalidate({ clie_idno: clientId });

  const saveContact = async () => {
    try {
      if (editingContactId) {
        await updateContactMutation.mutateAsync({
          cont_idno: editingContactId,
          cont_name: contactForm.cont_name,
          cont_role: contactForm.cont_role || undefined,
          cont_tele: contactForm.cont_tele || undefined,
          cont_mail: contactForm.cont_mail || undefined,
          cont_memo: contactForm.cont_memo || undefined,
          main_yesn: contactForm.main_yesn,
        });
        toast.success("담당자가 수정되었습니다.");
      } else {
        await createContactMutation.mutateAsync({
          clie_idno: clientId,
          cont_name: contactForm.cont_name,
          cont_role: contactForm.cont_role || undefined,
          cont_tele: contactForm.cont_tele || undefined,
          cont_mail: contactForm.cont_mail || undefined,
          cont_memo: contactForm.cont_memo || undefined,
          main_yesn: contactForm.main_yesn,
        });
        toast.success("담당자가 등록되었습니다.");
      }
      closeContactForm();
      await invalidateContacts();
      await utils.crm.client.get.invalidate({ clie_idno: clientId });
    } catch {
      toast.error("담당자 저장에 실패했습니다.");
    }
  };

  const deleteContact = async (cont_idno: number) => {
    try {
      await deleteContactMutation.mutateAsync({ cont_idno });
      toast.success("담당자가 삭제되었습니다.");
      await invalidateContacts();
      await utils.crm.client.get.invalidate({ clie_idno: clientId });
    } catch {
      toast.error("담당자 삭제에 실패했습니다.");
    }
  };

  const isSavingContact = createContactMutation.isPending || updateContactMutation.isPending;

  return {
    clientId,
    navigate,

    client: clientQuery.data,
    isLoading: clientQuery.isLoading,

    logs: logsQuery.data?.items ?? [],
    logsLoading: logsQuery.isLoading,

    orders: orders.filter((o) => o.clie_idno === clientId),
    ordersLoading: ordersQuery.isLoading,

    totalOrderAmount,

    // 담당자 관련
    contacts: contactsQuery.data ?? [],
    contactsLoading: contactsQuery.isLoading,

    showContactForm,
    editingContactId,
    contactForm,
    setContactForm,
    isSavingContact,

    openNewContact,
    openEditContact,
    closeContactForm,
    saveContact,
    deleteContact,
  };
}
