const handleAddsignature = async (member: any, memberdecision: string) => {
  const updatePayload = {
    id: unitDetail?.id,
    type: unitDetail?.type,
    member: {
      name: member.name,
      ic_number: member.ic_number,
      member_type: member.member_type,
      member_id: member.id,
      is_signature_added: true,
      sign_digest: 'something while development',
    },
    level: profile?.user?.user_role,
  };
  if (memberdecision === "accepted") {
    dispatch(updateApplication(updatePayload)).then(() => {
      dispatch(fetchApplicationUnitDetail({ award_type, numericAppId }));
      const allOthersAccepted = profile?.unit?.members
        .filter((m: any) => m.id !== member.id)
        .every((m: any) => decisions[m.id] === "accepted");

      if (allOthersAccepted && memberdecision === "accepted") {
        navigate("/applications/list");
      }
    });
  } else if (memberdecision === "rejected") {
    dispatch(
      updateApplication({
        ...updatePayload,
        status: "rejected",
      })
    ).then(() => {
      navigate("/applications/list");
    });
  }
};