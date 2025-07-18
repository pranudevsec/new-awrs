const handleAddsignature = async (decision: string, unit: any) => {
    const updatePayload = {
      id: unit?.id,
      type: unit?.type,
      member: {
        name: profile?.user?.name,
        ic_number: profile?.user?.pers_no,
        member_type: profile?.user?.user_role,
        iscdr: true,
        member_id: profile?.user?.user_id,
        is_signature_added: true,
        sign_digest: 'something while develope',
      },
      level: profile?.user?.user_role,
    };
    if (decision === "approved") {
      await dispatch(
        updateApplication({
          ...updatePayload,
          status: "approved",
        })
      ).then(() => {
        navigate("/applications/list");
      });
    } else if (decision === "rejected") {
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